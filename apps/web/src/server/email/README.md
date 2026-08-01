# Correo transaccional (Brevo)

17 plantillas HTML, funciones puras, sin dependencias de red. Nada de esto
manda correos todavía: falta el cliente de Brevo y los disparadores.

```bash
pnpm email:preview        # renderiza todas con datos de ejemplo en .email-preview/
xdg-open apps/web/.email-preview/index.html
```

## Estructura

| Archivo | Qué es |
|---|---|
| `theme.ts` | Colores y tipografías de marca, en hexadecimal (en correo no hay variables CSS) |
| `format.ts` | `esc()`, precios en COP, fechas en hora de Bogotá, `siteUrl()` |
| `components.ts` | Bloques HTML: titulares, botones, tablas, paneles |
| `layout.ts` | Lienzo compartido: cabecera, pie, preheader, versión en texto |
| `types.ts` | Forma de los datos que recibe cada plantilla |
| `samples.ts` | Datos de ejemplo para la vista previa |
| `templates/` | Una plantilla por archivo + `index.ts` con el registro |

Cada plantilla es `datos → { subject, preheader, html, text }`. No consultan la
base de datos ni leen entidades de TypeORM: quien envía arma el payload. Eso es
lo que permite verlas todas sin cuenta de Brevo y sin mandar un correo.

## Las 17

**Compra** — `order-paid`, `order-failed`, `order-cancelled`, `order-shipped`,
`order-delivered`, `checkout-abandoned`, `prescription-next-steps`.

**Reserva** — `waitlist-verify`, `waitlist-confirm`, `waitlist-available`,
`waitlist-reminder`, `waitlist-soldout`, `waitlist-unsubscribed`.

**Interno** — `admin-new-order`, `admin-out-of-stock`, `admin-waitlist-digest`,
`admin-password-reset`.

El disparador de cada una está en `templates/index.ts` (campo `trigger`).

## Idioma

**Todo en español.** Vendemos solo en Colombia, y un correo con los dos idiomas
apilados duplica el largo, arruina el escaneo en móvil y empeora el puntaje de
spam (mismo mensaje dos veces, el doble de enlaces).

Para añadir inglés cuando haga falta, sin reescribir nada:

1. Añadir `locale` a `axis_order` y a la tabla de la lista de espera, y
   guardarlo desde el checkout/formulario con el idioma que tenía el sitio.
2. En cada plantilla, sacar las cadenas a un `const ES = {...}` y añadir un
   `const EN = {...}` hermano (mismo shape, igual que `src/i18n/es.ts` y `en.ts`).
3. Pasar `locale` como segundo argumento del render y elegir el bloque, con ES
   como respaldo si falta.

No hace falta tocar `layout.ts` ni `components.ts`: ahí no hay copy fija salvo
el pie, que sigue el mismo patrón.

## Reglas del medio (no son gustos)

- Maquetación con `<table>`, nunca flex/grid: Outlook usa el motor de Word.
- Todo el CSS inline. El `<style>` del `<head>` solo para el ajuste móvil.
- Ancho 600px. Fondo declarado con `bgcolor` **y** con CSS inline.
- Nada de `background-image` para contenido, ni SVG, ni webfonts.
- Toda plantilla trae versión en texto plano: solo-HTML puntúa peor en spam.
- Todo dato de fuera pasa por `esc()` / `escUrl()`.
- La cabecera es texto, no un logo en imagen: los clientes bloquean imágenes
  remotas del primer correo de un remitente nuevo.

## Quién dispara cada correo (ya conectado)

| Disparador | Correos |
|---|---|
| Webhook Wompi `APPROVED` | `order-paid` al comprador, `admin-new-order` al equipo y `prescription-next-steps` si hay fórmula (`src/server/orderEmails.ts`) |
| Webhook Wompi `DECLINED`/`ERROR` | `order-failed` |
| Webhook Wompi `VOIDED` | `order-cancelled` |
| Stock 0 → >0 (`syncStockFromUnits`) | `waitlist-available` a toda la lista activa |
| Stock >0 → 0 | `admin-out-of-stock` |
| Alta en la lista de espera | `waitlist-confirm` (o `waitlist-verify` con doble opt-in) |
| Enlace de baja | `waitlist-unsubscribed` |
| Botón "avisar ahora" del panel | `waitlist-available` |

Sin disparador todavía: `order-shipped`, `order-delivered` (falta mover el
estado desde el panel), `checkout-abandoned` (falta el cron),
`admin-waitlist-digest` (falta el cron) y `admin-password-reset` (falta el flujo
de recuperación).

Regla que se repite en todos: el envío ocurre **fuera** de la transacción de
base de datos y con los errores contenidos. `sendEmail()` no lanza nunca.

## Cómo se evita mandar el mismo correo dos veces

Brevo acepta una **clave de idempotencia** dentro del objeto `headers` del
cuerpo (`{"headers": {"idempotencyKey": "<uuid>"}}`). Con la misma clave no
vuelve a enviar durante **30 minutos** y responde `duplicate_parameter`.

`idempotencyKeyFrom(semilla)` (en `brevo.ts`) convierte un identificador estable
—`pedido-pagado:<orderId>`, `reserva-disponible:<alertId>`— en un UUID v5
determinista. Determinista es el punto: el reintento de un webhook produce la
MISMA clave, así que Brevo descarta el segundo envío. Un UUID aleatorio no
serviría de nada. `sendEmail()` trata el `duplicate_parameter` como éxito
(`{ ok: true, duplicate: true }`): que no se enviara es exactamente lo buscado.

Es la segunda línea de defensa. La primera es el claim atómico del webhook
(`UPDATE … WHERE status = 'pending'`), que ya hace que solo una entrega procese
el pedido.

## Dos remitentes, a propósito

Brevo **bloquea a un contacto por remitente**: quien se dé de baja de un correo
deja de recibir los de ese buzón, no los de otro. Y Brevo añade la cabecera
`List-Unsubscribe` a *todos* los correos, incluidos los transaccionales.

Con un solo remitente eso significa que alguien que pulse "desuscribir" en un
aviso de reserva dejaría de recibir la confirmación de pago de su propia compra
—y reactivarlo a mano está prohibido por Brevo—. Por eso:

- `BREVO_SENDER_EMAIL` → pedidos (`stream: 'transactional'`, el de por defecto)
- `BREVO_LIST_SENDER_EMAIL` → reservas (`stream: 'list'`)

Si no se define el segundo, se usa el primero: funciona, pero con el riesgo
descrito. Conviene definirlo antes del primer envío real.

## Antes de enviar el primer correo

1. **Cuenta de Brevo** y remitente `axisvision.co` verificado.
2. **DNS del dominio** — sin esto todo se va a spam:
   - SPF: `v=spf1 include:spf.brevo.com ~all`
   - DKIM: el par de registros que da Brevo (`mail._domainkey`, `brevo._domainkey`)
   - DMARC: empezar en `v=DMARC1; p=none; rua=mailto:dmarc@axisvision.co`
     y endurecer a `p=quarantine` cuando los informes salgan limpios.
3. **Variables en `apps/web/.env`**:
   - `BREVO_API_KEY`
   - `BREVO_SENDER_EMAIL` (p. ej. `pedidos@axisvision.co`)
   - `BREVO_SENDER_NAME` (`AXIS Vision`)
   - `BREVO_REPLY_TO` (`contacto@axisvision.co` — que las respuestas lleguen a alguien)
   - `ADMIN_NOTIFICATION_EMAIL` (destino de los correos internos)
   - `NEXT_PUBLIC_SITE_URL` (ya hace falta para Wompi; los correos solo aceptan
     URL absolutas)
4. **Remitente**: nada de `no-reply@`. La gente responde a la confirmación de
   pago, y esas respuestas tienen que llegar a una bandeja real.
5. **El envío nunca bloquea el webhook de Wompi.** Wompi reintenta si la
   respuesta tarda o falla, y un reintento con el correo ya enviado duplica el
   mensaje. Enviar después de responder `200`, con `try/catch` y log.
6. **Idempotencia**: registrar qué correo se mandó por pedido para que un
   webhook repetido no dispare dos confirmaciones.
