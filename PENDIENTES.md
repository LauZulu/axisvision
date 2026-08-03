# Pendientes de AXIS Vision

Lista viva de lo que falta para que la tienda opere de verdad. Escrita el
**1 de agosto de 2026**.

Lo que ya está hecho y cómo funciona está en `CLAUDE.md`; esto es solo lo que
queda. **Al completar algo, bórralo de aquí** (o muévelo a "Resueltos" con la
fecha) para que la lista no mienta.

Cada tarea dice quién puede hacerla:

- 🔑 **Solo tú** — hay que entrar a un panel externo (Wompi, Brevo, DNS). No
  tengo acceso ni debo tenerlo.
- 🤖 **Yo** — es código; se puede hacer en cualquier momento.
- ⏳ **Yo, pero después de 🔑** — el código depende de algo que primero tienes
  que configurar tú.

---

## Wompi

### 🔑 Registrar la URL de eventos en el panel de Wompi

En el dashboard de Wompi, apartado de eventos, poner:

```
https://axisvision.co/api/wompi/webhook
```

**Por qué importa:** es el camino principal —y el único que no depende del
cliente— para confirmar un pago. La página de resultado también confirma
(`confirmPaidOrder`), pero solo si el cliente vuelve al sitio después de pagar.
Si cierra el navegador en la pantalla de Wompi y el webhook no está registrado,
el pedido se queda en `pending` para siempre aunque el dinero haya entrado.

Al registrarla, Wompi da el **secreto de eventos** → va a `WOMPI_EVENTS_SECRET`.

### 🔑 Pasar de llaves de sandbox a producción

Hoy la llave es `pub_test_` (sandbox): los pagos son de juguete. Para cobrar de
verdad hacen falta las tres de producción en `apps/web/.env` (y en el panel de
despliegue):

- `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` (`pub_prod_…`)
- `WOMPI_INTEGRITY_SECRET`
- `WOMPI_EVENTS_SECRET`

El entorno se deduce solo del prefijo de la llave pública: no hay que tocar
código. Ojo: el webhook descarta eventos cuyo `environment` no coincida con el
de la llave, así que las tres tienen que ser del mismo entorno.

### 🔑 Abrir la tienda

Con lo anterior listo: `NEXT_PUBLIC_STORE_MODE=live` **y volver a desplegar**
(es una variable `NEXT_PUBLIC_`, se hornea en el build). Sin esto la tienda
sigue en modo reserva, que es el valor por defecto a propósito.

### 🔑 Conciliar a mano los pedidos sin id de transacción

`pnpm payments:reconcile` cuadra los pedidos `pending` de los que conocemos el
id de la transacción. Los que no lo tienen los lista al final para buscarlos a
mano en el panel de Wompi por su referencia `AXIS-…`.

**No es pereza mía:** Wompi solo documenta `GET /v1/transactions/{id}`. **No
existe forma de buscar una transacción por nuestra referencia**, así que de un
pedido cuyo cliente nunca volvió al sitio y cuyo webhook nunca llegó, no hay
manera automática de saber el id. Esa cola se revisa a mano.

### ⏳ Automatizar la conciliación

El script existe y es idempotente. Falta decidir dónde correrlo periódicamente
(cron del hosting, GitHub Action, etc.) — depende de dónde acabe desplegado:

```bash
pnpm payments:reconcile --horas=2
```

### ⏳ Probar el flujo completo en sandbox

Con las llaves de sandbox puestas y `NEXT_PUBLIC_STORE_MODE=live` en local:
comprar, pagar con los datos de prueba de Wompi, y comprobar que llegan el
webhook, el correo y el descuento de inventario. Hoy no se puede: no hay llaves
configuradas.

---

## Correo (Brevo)

### 🔑 Crear la cuenta y verificar el dominio

La `BREVO_API_KEY` que hay en el `.env` responde **401 (Key not found)**: no
está saliendo ningún correo. Hace falta cuenta, llave válida y remitente
verificado.

### 🔑 DNS de `axisvision.co`

Sin esto todo se va a spam:

- SPF: `v=spf1 include:spf.brevo.com ~all`
- DKIM: los dos registros que da Brevo
- DMARC: empezar en `p=none` y endurecer a `p=quarantine` cuando los informes
  salgan limpios

### 🔑 Crear el segundo remitente

`BREVO_LIST_SENDER_EMAIL` (p. ej. `avisos@axisvision.co`), distinto del de
pedidos. Brevo bloquea a un contacto **por remitente**: con un solo buzón, quien
se dé de baja de un aviso de reserva dejaría de recibir la confirmación de su
propia compra, y reactivarlo a mano Brevo lo prohíbe.

### ⏳ Probar la cabecera `List-Unsubscribe` propia

La doc de Brevo dice que `headers` es para cabeceras *custom*, "no las
estándar"; la comunidad reporta que `List-Unsubscribe` funciona igual. No lo
metí en el camino de envío sin verificarlo: si Brevo lo rechazara, el correo se
perdería. Probar con un envío real cuando exista la cuenta y, si funciona,
apuntarlo a `/api/reservas/baja` para que la baja en un clic use nuestro
endpoint en vez del genérico de Brevo.

### 🤖 Bandeja de salida (outbox) con reintentos

Hoy, si Brevo falla, el correo se pierde: se registra en el log y se sigue (que
es lo correcto para no tumbar el webhook, pero no hay segundo intento). Si
importa que la confirmación de pago llegue **siempre**, falta una tabla de
correos pendientes con reintentos.

### 🤖 Disparadores que faltan

Plantillas ya escritas, sin nada que las dispare:

- `order-shipped` y `order-delivered` → falta el botón en el panel para mover el
  estado del pedido
- `checkout-abandoned` → falta el cron
- `admin-waitlist-digest` → falta el cron
- `admin-password-reset` → falta el flujo de recuperación de contraseña

---

## Assets del cliente (`TODO[AXIS]`)

### 🔑 Cosas que solo el cliente tiene

- Catálogo PDF → subirlo y ajustar `CATALOG_URL` en `src/config/brand.ts`
- Imagen Open Graph 1200×630 → referenciarla desde `app/layout.tsx`
- Datos reales de garantía, aliado clínico y registro de marca → `src/i18n/*.ts`
- Los pasos exactos del manual (carga, emparejamiento) para el correo
  `order-delivered`: hoy están redactados en genérico a propósito, para no
  describir un botón que quizá no existe

### 🔑 CORS del bucket S3

Falta la política CORS para que el navegador del admin pueda hacer PUT/DELETE
directo a S3 con las presigned URLs.

---

## Resueltos

_(vacío por ahora — al cerrar una tarea, muévela aquí con la fecha)_
