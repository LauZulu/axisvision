# Pendientes de AXIS Vision

Lista viva de lo que falta para que la tienda opere de verdad. Escrita el
**1 de agosto de 2026**, revisada contra el estado real el **8 de agosto de 2026**.

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
Esa variable ya tiene valor en el `.env`, así que probablemente esté registrada
en sandbox: queda **confirmarlo en el panel** y repetirlo al pasar a producción,
que tiene su propia URL de eventos y su propio secreto.

### 🔑 Pasar de llaves de sandbox a producción

Hoy la llave es `pub_test_` (sandbox, verificado el 8 de agosto): los pagos son
de juguete. Para cobrar de verdad hacen falta las tres de producción en
`apps/web/.env` (y en el panel de despliegue):

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

Las tres llaves de sandbox **ya están** en `apps/web/.env` (comprobado el 8 de
agosto), así que esto ya se puede hacer: poner `NEXT_PUBLIC_STORE_MODE=live` en
local, comprar, pagar con los datos de prueba de Wompi y comprobar que llegan el
webhook, el descuento de inventario y —cuando Brevo funcione— el correo.

Es la última prueba antes de tocar llaves de producción.

---

## Correo (Brevo)

### 🔑 Crear la cuenta y verificar el dominio

La `BREVO_API_KEY` que hay en el `.env` sigue respondiendo **401 (Key not found)** —
comprobado contra `GET /v3/account` el 8 de agosto—: no está saliendo ningún correo. Hace falta cuenta, llave válida y remitente
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

- `order-shipped` y `order-delivered` → el panel **sí** tiene el selector de estado
  (`OrderTable`), pero `updateOrderStatus()` solo escribe la columna: no manda el
  correo. Falta engancharlo a la transición (y decidir si se manda al volver a un
  estado ya visitado, para no repetir el aviso)
- `checkout-abandoned` → falta el cron
- `admin-waitlist-digest` → falta el cron
- `admin-password-reset` → falta el flujo de recuperación de contraseña

---

## Assets del cliente (`TODO[AXIS]`)

### 🔑 Cosas que solo el cliente tiene

- Catálogo PDF → `CATALOG_URL` apunta a `/catalogo-axis.pdf` y ese archivo **no
  existe** en `apps/web/public/`: hoy el enlace da 404
- Imagen Open Graph 1200×630 → `app/layout.tsx` ya la referencia como
  `/og-image.jpg`, pero el archivo **no existe**: al compartir el enlace no sale
  ninguna imagen
- Datos reales de garantía, aliado clínico y registro de marca → `src/i18n/*.ts`
- Los pasos exactos del manual (carga, emparejamiento) para el correo
  `order-delivered`: hoy están redactados en genérico a propósito, para no
  describir un botón que quizá no existe

---

## Catálogo y fotos (decisiones de contenido)

### 🔑 Dos fotos de Apex son de un lente que no se vende

Apex ofrece **un solo lente** (sol polarizado) + fórmula opcional, pero entre sus
7 fotos hay dos con lente **amarillo**. O se quitan desde el panel, o se acepta
que se enseñe un lente que no está en venta.

### 🔑 Empaque y estuche de Origin están dentro de un grupo de lente

En AXIS Origin, la foto del empaque completo está en "Lentes de sol" y las dos
del estuche en "Lentes transparentes". Si se quiere que salgan con cualquier
lente, hay que moverlas al grupo "Sirven para cualquier lente" desde el panel.

---

## Precios de los lentes

### 🔑 Confirmar los precios que hoy están en la tienda

Los sobrecostos de lente salen de la **lista del laboratorio 2026** (foto que
mandaste el 12 de agosto), cargados **tal cual, sin margen**, porque no
alcanzamos a definirlo. Están en la DB y se editan en `/admin/lentes`:

| Opción | Renglón de la lista | Precio | + antirreflejo |
|---|---|---|---|
| Lente de sol polarizado | — (viene montado con la gafa) | incluido | +20.000 ⚠ |
| Lente transparente | 1,5 BLANCO | 90.000 | +20.000 (→ 1,5 AR) |
| Transitions | 1,5 PHOTOCROMATICO | 220.000 | +70.000 (→ PHOTO AR) |
| Filtro de luz azul | 1,5 AR BLUE | 150.000 | ya lo trae |
| Filtro amarillo | 1,5 COLOR | 150.000 | +20.000 ⚠ |
| Antirreflejo | — | lo pone cada lente | — |
| Con tu fórmula médica | — | por confirmar (no se cobra) | — |

⚠ = suposición: la lista no trae renglón "con AR" para el polarizado ni para el
tinte de color, así que se les puso el mismo delta del blanco.

Cuatro cosas que hay que revisar:

1. **¿La lista es costo o precio de venta?** Si es lo que te cobra el
   laboratorio, estos números venden a costo: hay que subirlos por el margen.
2. **¿Los precios son por par?** Si fueran por lente suelto, hay que doblarlos.
3. **Filtro amarillo → "1,5 COLOR"** es una suposición (que el amarillo se hace
   con tinte). Si es otro producto de la lista, cámbialo.
4. **Cuánto cuesta el antirreflejo sobre el polarizado y sobre el amarillo.**
   La lista no tiene esos dos renglones; hoy están a +20.000 (el delta del
   blanco). Es lo único inventado de toda la tabla.

### 🔑 Falta el precio del polarizado graduado

El default de AXIS es sol polarizado y el caso más común va a ser **ese lente
con fórmula**, que es tallado y no aparece en la lista de "terminados". Hoy eso
no rompe nada —la fórmula se cotiza al recibirla— pero seguimos sin saber cuánto
cuesta. Si tienes la lista de tallados, con ella se puede dar un "desde".

### 🔑 Quién cotiza y cobra la fórmula

El checkout cobra montura + lente, y el correo de fórmula le dice al cliente que
el montaje se cotiza aparte, antes de mandar a tallar. Ese cobro **no pasa por
la plataforma**: hoy lo tiene que hacer una persona por WhatsApp. Falta definir
cómo (¿link de pago de Wompi? ¿en la óptica?) y quién responde.

---

## Resueltos

- **8 ago 2026 — CORS del bucket S3.** Ya está puesta la política (PUT/DELETE
  desde `axisvision.co`, `www.axisvision.co` y `localhost:3000`); es lo que
  permite que el admin suba fotos directo desde el navegador.
- **8 ago 2026 — Escrituras rotas solo en producción.** `TypeORMError: Cyclic
  dependency` por la minificación del servidor: qué se rompía cambiaba en cada
  despliegue (el panel de productos en uno, el alta de reservas en el siguiente).
  Arreglado con `experimental.serverMinification: false`.
- **8 ago 2026 — Lentes por modelo.** Apex ya no ofrece lentes que no existen
  para su armazón, y el servidor rechaza la compra aunque se salte la ficha.
- **12 ago 2026 — Precios de lente reales.** Se acabaron los 10.000 de
  placeholder: los cinco lentes valen lo de la lista 2026 y la fórmula pasó a
  "por confirmar" (`priceOnQuote`), que no se cobra al pagar y se cotiza al
  recibirla. Queda 🔑 confirmar margen y suposiciones, arriba.
- **12 ago 2026 — Antirreflejo como complemento.** Tercera pregunta del
  configurador, marcable sobre cualquier lente (`kind: 'coating'`). Su precio
  vive en cada LENTE (`arExtraPriceCop`) porque en la lista no cuesta lo mismo
  sobre todos: +20.000 sobre el blanco, +70.000 sobre el fotocromático, e
  incluido en el AR BLUE. Apex también lo ofrece.
