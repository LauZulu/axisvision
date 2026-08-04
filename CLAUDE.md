# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> ## ⚠️ Estado actual: migración a plataforma full-stack (en curso)
>
> **Lo que falta por hacer vive en `PENDIENTES.md`** (raíz del repo), con quién puede hacer cada
> cosa: 🔑 solo el usuario (paneles de Wompi/Brevo/DNS), 🤖 código, ⏳ código bloqueado por un 🔑.
> Consúltalo antes de proponer trabajo nuevo y bórrale las tareas que se completen.
>
> El repo dejó de ser una app Vite de una sola carpeta. Ahora es un **monorepo pnpm**
> con **Next.js** (App Router). El plan y las fases viven en **`PLAN-PLATAFORMA.md`**
> (fuente de verdad para la evolución). Estado: **Fases 0-6 hechas y verificadas contra RDS+S3
> reales** (monorepo + Next con paridad + tienda DB-driven + auth JWT/roles + middleware + panel
> admin + S3/CloudFront por presigned URLs + checkout invitado). Enfoque **guest checkout** (sin
> cuentas de cliente; solo admin tiene login). Pendiente: **Wompi (Fase 7, lo último)**.
>
> - **Estructura:** `apps/web/` (`app/` rutas, `src/` código portado + `src/server/` backend:
>   `db/` TypeORM, `auth/`, `products.ts`, `admin.ts`; `scripts/` migración/seed). `packages/*` placeholders.
> - **Comandos (raíz):** `pnpm dev`, `pnpm build` (incluye type-check), `pnpm start`, `pnpm lint`.
>   DB (desde `apps/web`): `pnpm db:check`, `pnpm db:migrate`, `pnpm db:seed`.
> - **DB:** Postgres/RDS vía TypeORM, `synchronize:false` SIEMPRE (solo migraciones), tablas `axis_*`.
>   El `.env` vive en **`apps/web/.env`** (NO leerlo) y es la única config. Conexión **DIRECTA** a la
>   RDS (`db-axis-optica...:5432`, accesible públicamente) — sin túnel ni `.env.local`. Auth:
>   `JWT_SECRET_MANAGMENT` (HS256 vía `jose`). Nota Next+TypeORM: en dev el HMR invalida la metadata
>   de entidades; `getDb()` (src/server/db/index.ts) detecta y reconstruye el DataSource — no quitar.
> - **Imágenes/S3:** bucket **privado** (`AWS_PRODUCTS_BUCKET`) con **versionado ACTIVADO** (un borrado
>   deja marcador y la versión anterior se recupera), lectura pública solo por **CloudFront**
>   (`NEXT_PUBLIC_CDN_URL`, ya definido). El admin sube/borra **directo a S3 con presigned URLs**
>   (`POST /api/admin/uploads/presign`, `src/server/s3.ts`) — el backend NUNCA procesa binarios.
>   **Ya NO hay imágenes en el repo**: todas viven en S3 y se sirven por CloudFront. Dos namespaces:
>   `products/...` (fotos subidas por el admin; únicas que el admin puede borrar de S3) y `site/...`
>   (fotos del sitio/landing y del seed; protegidas contra borrado en `deleteObjects` y el presign).
>   La landing usa el manifiesto `src/lib/siteImages.ts` (URL CDN + dimensiones intrínsecas, cero CLS);
>   subir/actualizar originales: `pnpm exec tsx scripts/migrate-images-to-s3.mts <carpeta>` (mide
>   dimensiones con `identify`; la carpeta se pasa por argumento, `src/assets/` ya no existe).
>   En la DB `axis_product_image.imageKey` guarda la **clave S3**; el frontend usa la URL de CloudFront
>   (`src/lib/cdn.ts`, `resolveProductSrc`). Verifica acceso con `pnpm s3:check`. **Falta CORS** en el
>   bucket para que el navegador del admin haga PUT/DELETE (ver PLAN/README).
> - **Confirmación del pago — un solo camino (`src/server/payments.ts`):** `confirmPaidOrder()`
>   concentra validar monto, claim atómico, inventario, correos y alertas; lo usan **el webhook Y la
>   página de resultado**. Que la página también confirme no es redundancia: el webhook era el ÚNICO
>   camino a `paid`, y con la URL de eventos mal puesta (o el servidor caído durante los 3 reintentos
>   de 24 h) el cliente pagaba y el pedido quedaba `pending` para siempre. El claim admite venir de
>   **`pending` o `failed`**: si un DECLINED marcó el pedido y después entra el pago, el dinero manda.
>   Devuelve `applied | already | unknown_reference | amount_mismatch | double_charge`; los dos
>   últimos NO se resuelven solos — mandan la plantilla `admin-payment-alert` al equipo (un APPROVED
>   con un `transactionId` distinto al guardado = al cliente le cobraron dos veces). Antes esos casos
>   eran un `console.error` silencioso.
> - **El carrito NO se vacía al salir a Wompi**, sino en la página de resultado cuando el pago queda
>   aprobado (`markCartPendingOrder()` / `clearCartIfPaid()` en `src/lib/cart.ts`). Vaciarlo antes
>   dejaba sin selección a quien recibiera un rechazo — y como Wompi **no permite reutilizar una
>   referencia** ya usada, tendría que rehacer la compra entera. Se guarda qué referencia salió a
>   pagar para no vaciar un carrito ajeno tras una compra por "Comprar ahora".
> - **Doble clic al pagar (idempotencia del checkout):** el navegador genera un UUID por intento
>   (`newAttemptId()` en `CheckoutClient`, guardado en `useRef` para que sobreviva a los re-render)
>   y lo manda como `idempotencyKey`; `axis_order.idempotencyKey` tiene índice ÚNICO (migración
>   `...006`) y `createGuestOrder()` devuelve el pedido existente en vez de crear otro (captura el
>   `23505` para la carrera de dos peticiones simultáneas). Sin esto, dos clics = dos pedidos
>   `pending` con dos referencias = posible doble cobro, doble descuento de stock y un correo de
>   "compra sin terminar" a quien sí compró. Hay además un cerrojo `useRef` en el submit: el
>   `disabled` por estado deja una ventana entre el clic y el re-render.
> - **Checkout + Wompi (Fase 7, implementada — faltan llaves):** compra invitado con carrito
>   localStorage (`src/lib/cart.ts`) o "Comprar ahora"; `POST /api/checkout` valida stock, crea
>   `axis_order` `pending` con precios DESDE LA DB y responde parámetros FIRMADOS del Web Checkout
>   (`src/server/wompi.ts`: firma integridad SHA256 server-side + `expiration-time` 1h). El pago se
>   confirma SOLO por `POST /api/wompi/webhook` (checksum timing-safe, idempotente, valida monto;
>   APPROVED→paid+stock−, DECLINED→failed, VOIDED→cancelled+restock). Resultado en
>   `/tienda/pago/resultado` (verifica vía API de Wompi Y comprueba que la referencia sea nuestra:
>   sin eso, pasar el id de una transacción ajena mostraba su referencia y su monto). Descuentos: `compareAtPriceCop` (tachado + badge).
>   Prueba integral: `pnpm exec tsx scripts/test-wompi.mts`. PENDIENTE del usuario: añadir al `.env`
>   `NEXT_PUBLIC_WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET`,
>   `NEXT_PUBLIC_SITE_URL` y registrar la URL de eventos en el dashboard de Wompi.
> - **Inventario real (por unidad) + lentes:** el catálogo son **6 modelos reales** cargados desde el
>   Excel del cliente (`AXIS-AI-GLASSES-INVENTARIO-*.xlsx`): Origin `M02`, Apex `AIMB-G5`,
>   Crystal `HK01`, Shadow `E03L`, Ocean `E03S`, Eclypse `M01PRO` (`axis_product.modelCode` es la
>   llave del match; `size` chico/mediano/grande define la banda de precio). Cada gafa **física** es
>   una fila en **`axis_product_unit`** (serial `AX01`…, `location` fds/casa/local/sold, `lensType`,
>   `sellable`, `note`). **`axis_product.stock` es DERIVADO**: lo recalcula `syncStockFromUnits()`
>   (`src/server/inventory.ts`) contando unidades `sellable` en casa o local — no editarlo a mano.
>   Importar/resincronizar: `pnpm inventory:import [ruta.xlsx] [--dry]` (idempotente, upsert por
>   `modelCode`/`code`; el catálogo con precios y copy vive en `CATALOG` dentro del script). El lector
>   de `.xlsx` es propio y sin dependencias (`scripts/lib/xlsx.ts`). **Ojo:** la columna "Tipo Lente"
>   del Excel dice `Sunglass` en todas las filas incluso en las oftálmicas — el dato real es el
>   sufijo `/O` del nombre; las oftálmicas se cargan con `sellable:false` (son muestra).
>   **Personalización de lente — DOS preguntas, no una lista:** el configurador de la ficha pregunta
>   (1) **qué lente** lleva la montura —excluyentes: sol polarizado (incluido), transitions,
>   transparente, filtro azul, filtro amarillo— y (2) **si va con la fórmula** del cliente, que es un
>   **complemento** que se suma a *cualquiera* de ellos. Ambas viven en **`axis_lens_option`**
>   separadas por la columna **`kind`** (`'lens'` \| `'prescription'`; helpers `lensTypes()` y
>   `prescriptionAddon()` en `src/lib/lenses.ts`). Antes eran 6 opciones excluyentes y el modelo se
>   contradecía solo —"Transitions: disponible con o sin fórmula", pero elegirlo dejaba la fórmula
>   fuera de alcance— además de convertir la ficha en un muro de 6 barras más alto que la foto
>   (migración `1720000000005-LensPrescriptionAddon`). Snapshot en `axis_order_item`:
>   `lensOptionId/Name` + `lensExtraPriceCop` para el lente y `prescriptionOptionId/Name` +
>   `prescriptionExtraPriceCop` + `prescriptionNote` para la fórmula — los correos del pedido
>   desglosan los dos. El usuario final NO ve "sol vs oftálmico" como productos distintos.
>   El selector es `LensPicker` (fichas compactas + casilla) y el carrito indexa por
>   **producto + lente + fórmula** (`lineId()` en `src/lib/cart.ts`): el mismo modelo con dos
>   configuraciones son dos líneas. El sobrecosto y la validación de la fórmula los aplica SIEMPRE el
>   servidor (`src/server/checkout.ts`), nunca el cliente; el precio final es
>   `producto + lente + fórmula`. Un tipo de lente con `requiresPrescription` impone la casilla
>   (queda marcada y bloqueada). Al confirmar el pago, el webhook marca **unidades reales** como
>   `sold` (`sellUnits`/`releaseUnits`) y deriva el stock — nunca `stock - n`.
> - **Ficha de producto (`ProductDetail`):** dos columnas con la galería **`sticky`** — la columna
>   derecha siempre es más larga que la foto, y sin eso se elegía el lente mirando una franja vacía.
>   La galería es **`ProductGallery`** (store), NO el `ImageCarousel` de la landing: **no auto-rota**
>   (en la ficha el cliente está comparando y una foto que se mueve sola le estorba) y todas las
>   fotos están a la vista en una tira de miniaturas. El alto manda sobre la proporción en `lg`
>   (`lg:h-[min(64vh,38rem)]`) para que la columna entera quepa en pantalla de portátil.
> - **Panel admin:** `/admin/productos` (nombre, modelo, talla, precio, descuento, visibilidad, orden
>   y fotos), `/admin/inventario` (unidad por unidad: ubicación, vendible, nota; guarda al vuelo y
>   resincroniza el stock) y `/admin/lentes` (CRUD de opciones, con el selector `kind` para decir si
>   la fila es un tipo de lente o el complemento de fórmula). El campo `stock` sale de solo
>   lectura cuando el producto tiene unidades — se gestiona moviendo unidades, no tecleando.
> - **Fotos de producto en S3 (57 reales, ya cargadas):** viven en
>   **`products/<slug>/<variante>/<categoria>-NN.<ext>`**. Las subidas manuales desde el admin usan
>   `products/<slug>/<uuid>.<ext>` (el presign recibe el `slug`). Ya **no quedan fotos de ejemplo**:
>   `pnpm images:sample` sigue existiendo para volver a poblar con fotos de `site/` si hiciera falta,
>   pero el catálogo actual usa fotos reales. El buzón local es
>   **`fotos-para-subir/<slug>/<variante>/`** (raíz del repo, en `.gitignore`). Variantes válidas:
>   `sunglass`, `oftalmica`, `amarillo` (fotos sueltas en `<slug>/` = sin variante, sirven para
>   todas). Se suben con `pnpm images:upload [--dry] [--keep-samples]`, que renombra a
>   **`products/<slug>/<variante>/<categoria>-NN.<ext>`** (categorías `frente`, `angulo`, `detalle`,
>   `estuche`, `puesta`, `otro`), guarda la variante en `axis_product_image.lensVariant`, reemplaza
>   las filas del producto y borra del bucket las `ejemplo-*` huérfanas. El orden y la categoría
>   salen de `fotos-para-subir/<slug>/<variante>/orden.json`
>   (`[{"file":"PXL_1.jpg","category":"frente"}]`, primero = portada), escrito DESPUÉS de revisar las
>   fotos una a una; sin manifiesto se adivina por el nombre del archivo.
> - **Galería por variante de lente:** `axis_lens_option.imageVariant` dice qué fotos mostrar al
>   elegir cada opción (sol→`sunglass`; fórmula/transitions/filtro azul/transparente→`ophthalmic`;
>   filtro amarillo→`yellow`). La ficha usa `imagesForLens()` (`src/lib/lenses.ts`): devuelve las de
>   esa variante + las neutras y, si el modelo no tiene esa variante, cae a **una sola** alternativa
>   (sol primero) — **nunca mezcla variantes** en la misma galería. El `<ImageCarousel>` se remonta
>   con `key` al cambiar de lente. Realidad del catálogo: Origin y Eclypse tienen sol + oftálmica;
>   Shadow y Ocean solo sol; **Crystal solo oftálmica** (lente transparente); **Apex es deportivo con
>   lentes intercambiables** (espejado + amarillo), sin fotos oftálmicas.
> - **Modo tienda (`NEXT_PUBLIC_STORE_MODE`):** interruptor que decide si se puede COMPRAR.
>   `live` = compra abierta; **cualquier otro valor o sin definir = `preview`** (solo reservar) — el
>   default inseguro sería cobrar sin pasarela, así que el fallback es no cobrar. Cliente:
>   `canBuy()` (`src/lib/storeMode.ts`, puro, se puede importar en componentes). Servidor:
>   `canCheckout()` (`src/server/storeMode.ts`), que además exige que estén las 4 variables de Wompi
>   — encender la bandera con una llave a medias dejaría un botón que lleva a un 500. En preview:
>   la ficha cambia comprar por el formulario de reserva, la tarjeta lleva badge "Próximamente",
>   el carrito esconde "ir a pagar" (pero NO se borra) y `/tienda/checkout` + `POST /api/checkout`
>   responden cerrado. El front es maquillaje; la guarda de verdad es la del servidor.
>   Ojo: la variable es `NEXT_PUBLIC_`, así que se hornea en el build — cambiarla exige
>   reconstruir/redesplegar, no basta con editar el entorno del hosting.
> - **Reservas / lista de espera:** tabla **`axis_stock_alert`** (migración `...004`) con único
>   (productId, email); `src/server/waitlist.ts` es todo el flujo. Alta pública en
>   `POST /api/reservas` (rate-limit + honeypot `website`), confirmación y baja por token opaco en
>   `/api/reservas/confirmar|baja` → redirigen a `/reservas/gracias`. **El aviso lo dispara el
>   inventario**: `syncStockFromUnits()` devuelve `{stock, previous}` por producto y
>   `handleStockTransitions()` convierte 0→>0 en correos a la lista y >0→0 en aviso al equipo
>   (el inventario NO importa el correo; se pasa por el valor de retorno). Panel en
>   `/admin/reservas` con botón "avisar ahora" (`POST /api/admin/reservas`) para el caso que la
>   transición no cubre: gente apuntada con la tienda cerrada en modelos que ya tienen stock.
>   **La baja NO se ejecuta en el GET**: `/api/reservas/baja` con GET solo redirige a
>   `/reservas/baja`, una página con un botón que hace POST. Los escáneres de correo (Safe Links,
>   antivirus corporativos) abren TODOS los enlaces de un mensaje; con la baja en el GET darían de
>   baja en silencio a gente que nunca pulsó nada. El POST es además la forma que exige RFC 8058.
>   Doble opt-in **apagado** por defecto (`WAITLIST_DOUBLE_OPT_IN=true` para encenderlo): con Brevo
>   sin configurar dejaría a todos en `pending` para siempre.
> - **Correo transaccional (Brevo, plantillas listas · envío PENDIENTE):** 17 plantillas HTML en
>   **`src/server/email/`** (`theme/format/components/layout/types` + `templates/`, una por archivo,
>   registro con su disparador en `templates/index.ts`). Son **funciones puras** `datos → {subject,
>   preheader, html, text}`: no leen la DB ni entidades de TypeORM, así que se revisan sin cuenta y
>   sin mandar nada con **`pnpm email:preview`** (escribe `.email-preview/`, ignorado por git).
>   **Todo en español** (solo vendemos en Colombia; nada de correos bilingües apilados) — cómo
>   añadir inglés sin reescribir: `src/server/email/README.md`, que además trae el checklist de
>   Brevo (SPF/DKIM/DMARC, variables `.env`, no bloquear el webhook de Wompi). Grupos: compra
>   (7, incl. fórmula médica y carrito abandonado), reserva/lista de espera (6) e internos (4).
>   Reglas del medio: `<table>` + CSS inline, 600px, sin webfonts ni SVG ni `background-image`,
>   siempre versión en texto plano, todo dato de fuera por `esc()`.
>   **Idempotencia:** `sendEmail()` acepta `idempotencyKey` (cabecera documentada de Brevo, TTL 30
>   min); `idempotencyKeyFrom('pedido-pagado:<id>')` da un UUID v5 determinista, así un reintento
>   del webhook no manda dos comprobantes. **Dos remitentes:** Brevo bloquea al contacto POR
>   REMITENTE y añade `List-Unsubscribe` también a los transaccionales, así que las reservas salen
>   de `BREVO_LIST_SENDER_EMAIL` (`stream:'list'`) y los pedidos de `BREVO_SENDER_EMAIL` — con un
>   solo buzón, quien se da de baja de un aviso pierde la confirmación de su propio pago.
> - **Rutas:** landing `app/page.tsx`; tienda `app/tienda/**` (server, lee DB); admin `app/admin/**`
>   (login + panel guardado por rol); reservas `app/reservas/gracias`; API en `app/api/**` (auth,
>   products, admin, uploads/presign, checkout, reservas, wompi/webhook).
> - **Variables de entorno:** el `.env` real vive en `apps/web/.env` (NO leerlo); los nombres y para
>   qué sirve cada uno están en **`apps/web/.env.example`** (versionado, sin valores).
> - Buena parte de lo de abajo (Vite, `index.html`, `src/index.css`) describe la etapa
>   **anterior a la migración**; para rutas/estructura usa esta nota y `PLAN-PLATAFORMA.md`.

## Qué es este proyecto

**AXIS Vision** es una marca de **gafas con inteligencia artificial**. Este repo es su **vitrina B2C** (landing de una sola página, en español con interruptor a inglés).

**Objetivo #1:** convencer al **usuario final (persona natural)** de que quiere AXIS y llevarlo a **reservar/comprar por WhatsApp**. NO hay mensaje mayorista (ópticas/retailers/distribuidores) — el sitio dejó de ser B2B.

**Es vitrina:** SIN backend, SIN base de datos, SIN checkout. La conversión es el contacto por WhatsApp.

**Tema:** oscuro por defecto + claro, con interruptor en el Nav (sol/luna). El tema se aplica con `<html data-theme>` y se persiste en `localStorage` (`axis-theme`); el script anti-FOUC vive en `index.html`. El cambio se hace a nivel de variables CSS en `src/index.css` (`:root[data-theme='light']` re-mapea solo los neutros carbón/blanco; el dorado y el Morpho no cambian). La sección Capabilities usa color fijo (siempre clara) y no sigue el tema.

> **`PLAN-AXIS.md`** contiene el detalle de estrategia y diseño de la vitrina, ya **100% B2C** (sistema visual, tokens, animación, mapa de sitio, copy por sección orientado al usuario final). Para la evolución a plataforma full-stack (tienda, auth, DB, Wompi) la fuente de verdad es **`PLAN-PLATAFORMA.md`**; para copy/estructura de la vitrina, `PLAN-AXIS.md` y este CLAUDE.md están alineados.

Barra de calidad visual y de animación: **Apple · Whoop · Ray-Ban × Meta**. Minimalista, premium, multinacional, serio y confiable.

## Comandos

Gestor de paquetes: **pnpm** (hay `pnpm-lock.yaml`).

```bash
pnpm install      # instalar dependencias
pnpm dev          # servidor de desarrollo (Vite, HMR)
pnpm build        # type-check (tsc -b) + build de producción (vite build)
pnpm preview      # servir el build de producción localmente
pnpm lint         # ESLint sobre todo el repo
```

No hay framework de tests configurado todavía. `pnpm build` corre `tsc -b` primero, así que un build fallará ante errores de tipos — úsalo como verificación de tipos completa.

## Stack y tooling

- **Vite 8** + **React 19** + **TypeScript** (ESM, `"type": "module"`).
- **React Compiler activo** vía `@rolldown/plugin-babel` con `reactCompilerPreset()` en `vite.config.ts`. No añadas memoización manual (`useMemo`/`useCallback`) por defecto: el compilador la maneja. Respeta las reglas de los hooks (el lint las verifica).
- **ESLint flat config** (`eslint.config.js`): `js.recommended` + `typescript-eslint` + `react-hooks` + `react-refresh`. Ignora `dist`.

## Stack instalado

El sitio ya está construido (NO es el template base). Sobre Vite/React/TS:

- **Estilos:** Tailwind CSS v4 (`@import 'tailwindcss'` en `src/index.css`); tokens de marca en `@theme` + utilidades propias (`.btn-axis`, `.eyebrow`, `.bg-morpho`, `.container-axis`).
- **Animación:** `framer-motion` + `lenis` (smooth scroll en `src/lib/SmoothScroll.tsx`); variants/easings en `src/lib/motion.ts`. Animar solo `transform`/`opacity` (y `filter` de forma puntual, p. ej. el carrusel); honrar `prefers-reduced-motion` siempre.
- **i18n:** `react-i18next` con diccionarios **TypeScript** `src/i18n/es.ts` y `en.ts` (NO json). El tipo se deriva de `es` (`Dict = typeof es`) → **ambos deben tener el mismo shape**. Acceso tipado con `useDict()` → `t`. **Español por defecto**; nada de texto hardcodeado, incluidos los `alt` de imágenes (en `t.alt`).
- **Fuentes self-host** (`@fontsource`: Inter Tight, DM Sans, DM Mono, Cormorant Garamond), importadas en `src/main.tsx`.
- **Imágenes:** `next/image` sobre CloudFront (ver "Imágenes y assets").
- **Contacto:** todo sale de `src/config/brand.ts` (`WHATSAPP_NUMBER`, `SALES_EMAIL`, `whatsappLink()`). Hoy: WhatsApp `+57 312 3727253` y `contacto@axisvision.co`. Única vía confirmada: **WhatsApp Business** (sin formulario backend).

## Estructura del repo

```
apps/web/src/
  components/ui/   Reutilizables: TreeLogo, GlassesArt, Icon, Reveal, CountUp,
                   SectionHeading, Img, ImageCarousel
  components/store/  Tienda (ProductDetail, LensPicker, CartView, CheckoutClient…)
  components/admin/  Panel (ProductForm, InventoryView, LensOptionsView…)
  sections/        Una por sección de la landing (Nav, Hero, StoreRail,
                   ProductShowcase, Capabilities, Lifestyle, FaqCommercial,
                   ContactCommercial, Footer)
  i18n/            es.ts, en.ts, index.ts (init i18next), useDict.ts
  lib/             SmoothScroll, motion, cart, products, lenses, cdn, siteImages
  config/          brand.ts (WhatsApp, correo, catálogo)
  server/          backend: db/ (TypeORM), auth/, products, admin, inventory,
                   lenses, checkout, wompi, s3
apps/web/app/      rutas (landing, tienda/**, admin/**, api/**) + globals.css
apps/web/public/   favicon.svg
```

**Ya NO existen** `src/assets/`, `src/images.d.ts` ni `src/index.css`: eran de la
etapa Vite. Ninguna imagen vive en el repo (salvo el favicon).

## Imágenes y assets — organización y nomenclatura

**Todas las imágenes viven en S3 y se sirven por CloudFront.** No hay imágenes en
el repo (solo `apps/web/public/favicon.svg`). Dos namespaces en el bucket:

- **`site/<categoría>/`** → fotos de la landing. Categorías: `hero/`, `lifestyle/`,
  `packaging/`, `retail/`, `product/`, `brand/`, `capabilities/`, `press/`.
  El manifiesto con URL + dimensiones intrínsecas está en `src/lib/siteImages.ts`
  (cero CLS). Para subir originales nuevos:
  `pnpm exec tsx scripts/migrate-images-to-s3.mts <carpeta>` (mide con `identify`
  y te imprime el manifiesto). **Protegidas** contra borrado desde el admin.
- **`products/<slug>/<variante>/`** → fotos de producto, por `pnpm images:upload`
  desde el buzón `fotos-para-subir/` (ver la nota de estado arriba). Son las
  únicas que el admin puede borrar.

**Nomenclatura:** minúsculas-con-guiones, sin espacios/acentos/ñ. Originales en
máxima resolución (ideal ≥2400px de ancho); `next/image` genera las variantes.

**Cómo se renderizan:**
- Fotos de la landing: `<Img>` (`src/components/ui/Img.tsx`) con una entrada de
  `siteImages.ts` — lleva `width/height` intrínsecos (cero CLS), `loading="lazy"`
  por defecto y `priority` para el LCP (hero). `alt` SIEMPRE desde i18n (`t.alt.*`),
  salvo fondos decorativos a sangre (`alt=""`, ver el hero). Con `fill` la foto
  rellena al contenedor (`relative` + alto propio) en vez de usar su tamaño
  intrínseco; acompáñalo de `object-cover`/`object-contain`.
- Fotos de producto: la clave S3 de la DB se resuelve con `resolveProductSrc`
  (`src/lib/productImages.ts`) → URL de CloudFront.
- `next/image` optimiza y redimensiona en el servidor (el dominio del CDN está en
  `next.config.ts → images.remotePatterns`). No hace falta pipeline de build.
- **Carrusel:** `<ImageCarousel>` (`src/components/ui/ImageCarousel.tsx`) — auto-rota con disolver suave (todas las slides montadas para no parpadear; la anterior se desvanece + desenfoca por encima). Con `fit="contain"` rellena los márgenes con la misma foto borrosa y **oscurecida con `brightness`** (no `opacity`, para que borde e imagen se desvanezcan a la par).

## Pendiente (assets reales del cliente · `TODO[AXIS]`)

- **Catálogo PDF** → subir y ajustar `CATALOG_URL` en `src/config/brand.ts`.
- **Imagen Open Graph** → falta (1200×630), referenciar desde `app/layout.tsx`.
- **Datos reales** de garantía, aliado clínico y registro de marca → `src/i18n/*.ts`.

## Sistema de diseño — usar los valores EXACTOS

Identidad visual no negociable (detalle y reglas de uso en `PLAN-AXIS.md` §7):

- **Negro carbón** `#0A0A0A` / `#0D0D0D` — fondo base (nunca negro puro).
- **Dorado antiguo** `#C8A96E` — SOLO líneas finas, etiquetas, contornos y el símbolo de marca. **Nunca** rellenos grandes.
- **Dorado profundo** `#8B6B35` — detalle.
- **Blanco cálido** `#F5F3EE` — una **única** sección de "luz" (zona técnica/comercial).
- **Gris cálido** `#D8D6CF` — texto cuerpo, 18-20px, line-height 1.6.
- **Iridiscencia Morpho** (el azul elegante, firma cromática distintiva) — gradiente `#1A3A8A → #2A5ADA → #2A1A4A → #0A0A1F`. **Único color vibrante** sobre carbón+dorado. Uso **raro = magia** (2-4 veces en toda la página): destello del hero, `MorphoSheen` que cruza el CTA una sola vez al entrar en viewport, momentos clave. **El hover del `.btn-axis` YA NO es Morpho**: se rellena con `--gradient-gold` (bronce profundo + barrido de luz dorada) y el texto pasa a `--color-on-gold` — el azul a pantalla completa en el botón se comía la elegancia carbón+dorado. El gradiente pesa hacia `--color-gold-deep` a propósito: sobre el dorado claro el texto blanco se queda en ~2:1 de contraste. Nunca fondo plano dominante, nunca decoración floral.

**Logo / sello recurrente:** el **símbolo dorado de AXIS** — un **árbol-runa** (tronco en Y,
rama izquierda larga, y una rama derecha de la que nace una rama interior, con **un** chevron
suelto encima), implementado como SVG en `src/components/ui/TreeLogo.tsx` (con animación de
dibujado del trazo y `currentColor` para heredar el dorado). Es el sello central (nav, footer,
watermark de contacto; el hero ya no lo lleva — la portada es una foto a sangre y el árbol
competiría con el producto). El alma de origen (evolución, "una nueva forma de ver el mundo")
vive como ADN sutil en el logo y la elegancia, **no** como decoración.

**La geometría es la OFICIAL y no se toca a ojo.** Sale del vectorial de Illustrator del cliente
(`CORTES OPTICA.pdf`): el contorno relleno tal cual está en `apps/web/public/logo-axis.svg`, y
`TreeLogo`/`favicon.svg` usan el **eje central** de cada trazo (bisectriz de sus dos bordes
paralelos) porque necesitan `stroke` para animar el dibujado. Dos detalles que la reconstrucción
anterior tenía mal y conviene no volver a introducir: hay **un** chevron, no dos anidados, y ese
chevron es **más fino** que el árbol (8.449 vs 12.19 unidades del `viewBox`, de ahí
`CHEVRON_RATIO`). Redibujarlo a mano rompe la identidad; si hay que reescalar, cambia
`strokeWidth`, no los números de los `d`.

**Portada (hero):** foto **a sangre** ocupando el viewport (`min-h-[100svh]`), con el
titular, el subtítulo y los CTA **centrados** encima. La misma composición existe en
dos fondos y cada tema estrena el suyo: `site/hero/hero-producto.jpeg` (carbón) y
`site/packaging/empaque-abierto-con-gafas.jpeg` (crema). El intercambio es **puro
CSS** con la variante `light:` (definida con `@custom-variant` en `globals.css`), así
que lo decide el `data-theme` que ya puso el script anti-FOUC y no parpadea al
hidratar; ambas van con `alt=""` (decorativas — `opacity:0` no las saca del árbol de
accesibilidad, así que con texto se anunciarían las dos). La foto va con un
desenfoque suave y debajo del velo **`.hero-scrim`** (`globals.css`), construido
sobre `--color-carbon-900` para que el mismo velo oscurezca la versión carbón y
aclare la crema; el tema claro lleva su propio refuerzo porque el titular es carbón
y cae justo sobre el producto oscuro de la foto. Si cambias la foto, revisa el
contraste del titular **en los dos temas** antes de dar por bueno el cambio.

**Nada se cuenta dos veces** (la landing venía de 11,5 pantallas de scroll y bajó a
9,2). Siete secciones: hero → vitrina → diseño → manifiesto+capacidades → lifestyle →
FAQ → cierre. Dos reglas, detalladas en el comentario de `app/page.tsx`:

- Cada cosa que AXIS **hace** vive solo en `Capabilities` (los 8 `t.capabilities.items`),
  encabezada por el manifiesto (`t.capabilities.statement`). Se retiró la sección
  `WhatIsAxis`: sus 4 pilares estaban ya en esa lista —dos con el mismo título— y la
  propia frase los enumera. `ProductShowcase` habla solo de materiales y hechura.
- El **momento de compra** vive solo en `ContactCommercial`. Se retiró
  `ShowcaseBanner` ("Tuyas hoy"), que repetía ese cierre y caía pegado al CTA de
  `Capabilities`; su foto pasó al cierre como fondo (velo `.closing-scrim`). Entre
  nav, hero, capacidades, cierre y `BuyBar` ya sobran CTAs: no añadas otra sección-CTA.
  **Nunca dos "Comprar AXIS" a la vez:** la `BuyBar` (fija abajo, solo móvil) y el
  pie del menú hamburguesa son ambos `fixed` con el mismo z-index, así que la barra
  se esconde mientras el menú está abierto — el estado del menú vive en
  `src/lib/menuOpen.ts` (store externo, no `useState`, porque los dos componentes
  están en ramas distintas del árbol). Y **dentro de `/tienda/**` el Nav no pinta
  el CTA**: lleva a donde el usuario ya está y en la ficha compite con el botón de
  comprar de verdad.
- `Lifestyle` son 5 fotos, cada una con una situación distinta y **solo gente
  llevando AXIS** (es lo que promete su copy). Si añades, que aporte contexto nuevo.

**Revelados con `whileInView` (trampa real):** el trigger NUNCA va en un elemento
que arranca desplazado fuera del recorte de su padre. El `IntersectionObserver`
intersecta también contra los clips de los ancestros, así que un `<h2>` con
`initial={{ y: '105%' }}` dentro de un `overflow-hidden` tiene ratio 0 permanente,
no dispara nunca y **se queda invisible para siempre** (así estuvieron 5 de los 7
títulos de sección). El patrón correcto está en `SectionHeading`: `whileInView` en
la máscara, y el hijo entra por `variants`.

**Tipografía (ruta híbrida confirmada):** **Inter Tight** (titulares/columna corporativa-tech) + **Cormorant Garamond** (solo hero y 1-2 frases manifiesto = alma de lujo) + **DM Sans** (cuerpo) + **DM Mono** (etiquetas/eyebrows en MAYÚSCULAS doradas con tracking amplio 0.15-0.25em).

## Restricciones que no se deben romper

- **Enfoque B2C:** todo el copy le habla al usuario final; nada de lenguaje mayorista.
- **Bilingüe ES/EN** con español por defecto; nada de texto hardcodeado.
- **Mobile-first** y 60fps; el lujo no puede costar rendimiento (AVIF/WebP + lazy, LCP < 2.5s).
- **Imágenes SIEMPRE desde S3/CloudFront** vía `next/image` (`<Img>`, `<ImageCarousel>` o `resolveProductSrc`), con `alt` desde i18n. Nunca `<img src>` crudo de una foto pesada ni `background-image` para fotos. No volver a meter imágenes en el repo.
- Dorado solo en líneas/contornos; Morpho solo en destellos puntuales.
