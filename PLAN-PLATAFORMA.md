# PLAN-PLATAFORMA.md — AXIS Vision: de vitrina a plataforma full-stack

> Documento de estrategia y paso a paso. Fuente de verdad para la evolución del sitio.
> Complementa (no reemplaza) a `CLAUDE.md`. `PLAN-AXIS.md` es histórico (etapa B2B) — ignorar su estrategia.

---

## 0. Qué estamos construyendo

Hoy el repo es una **vitrina B2C de una sola página** (Vite + React 19 + TS, sin backend). Vamos a convertirla en una **plataforma full-stack** manteniendo intacta la identidad visual y de animación (Apple · Whoop · Ray-Ban × Meta).

Cuatro entregables nuevos:

1. **Catálogo de 4 productos** (modo test): 4 gafas AXIS mostradas en una tienda, **reutilizando las imágenes que ya están en el repo** para representarlas (aún no hay fotos por producto). Futuro: S3 de AWS.
2. **Autenticación**: registro + inicio de sesión de usuarios, cuenta persistente. JWT (HS256) + bcrypt, replicando los patrones descritos.
3. **Admin dashboard**: panel protegido por rol `admin`, conectado a la **base de datos real** (RDS de prod, vía las variables ya presentes en `.env`) para gestionar inventario/catálogo.
4. **Checkout con Wompi** (próximamente): scaffolding listo para pagos; se activa después.

### Decisiones de arquitectura (ya tomadas)

| Decisión | Elección | Implicación |
|---|---|---|
| Backend | **Migrar a Next.js** (App Router, full-stack) | Un solo proyecto: UI + route handlers `/api/*` + server actions. No hay NestJS; se **replica su semántica** con primitivas Next. |
| Layout de código | **Monorepo pnpm** | `apps/web` (la app Next full-stack) + `packages/*` para tipos/entidades compartidas. Un solo git. |
| Base de datos (ahora) | **RDS de producción ya** | Se crean las tablas AXIS **vía migraciones**, `synchronize: false` **SIEMPRE**. Nunca auto-sync contra la RDS. |

### Convención de esta etapa: "modo test"

Mientras construimos, **todos los commits van marcados como test/WIP**. Convención:

```
test(axis): <qué se hizo>     # trabajo en progreso de esta migración
```

Cuando una fase quede estable y verificada, se puede promover a `feat:`/`fix:`. Los 4 productos, sus imágenes repetidas y datos son **datos de prueba** hasta que llegue el material real del cliente.

---

## 1. Guardarraíles que NO se rompen

- **Secretos server-only.** `JWT_SECRET_MANAGMENT`, `MFA_TEMP_SECRET`, `POSTGRES_*`, y las llaves privadas de Wompi **JAMÁS** llegan al bundle del cliente. En Next, solo las variables con prefijo `NEXT_PUBLIC_` se exponen al navegador. Todo lo demás vive únicamente en el servidor (route handlers, server actions, server components). **Verificación obligatoria:** tras el build, `grep` el JWT secret y el password de Postgres en `.next/static` → debe dar **cero** resultados.
- **No leer `.env`.** Contiene producción. Ya trae las variables de DB y de JWT. No se abre, no se imprime, no se commitea (confirmar que está en `.gitignore`).
- **`synchronize: false` contra la RDS, sin excepción.** Todo cambio de esquema pasa por **migraciones**. El repo finidian ya perdió una columna por synchronize — no repetir.
- **Fail-closed.** El middleware protege **todo** por defecto; las rutas públicas se listan explícitamente. Si olvidamos proteger algo, queda protegido.
- **Identidad visual y perf intactas.** Se preserva el sistema de diseño (carbón/dorado/Morpho), i18n ES/EN (español por defecto, nada hardcodeado), mobile-first, 60fps, LCP < 2.5s, imágenes responsive AVIF/WebP + lazy.
- **`bcrypt` con 10 salt rounds**, campo `password` con `select: false` + `addSelect` explícito solo en el método de auth.

---

## 2. Arquitectura objetivo

```
                 ┌─────────────────────────────────────────────┐
   Navegador ──▶ │  Next.js (App Router)  ·  apps/web           │
                 │                                             │
                 │  CLIENTE (React 19, actual UI portada)      │
                 │   · Landing (sections/*)                    │
                 │   · /tienda, /tienda/[slug]                 │
                 │   · /login /registro /cuenta                │
                 │   · /admin/* (solo rol admin)               │
                 │                                             │
                 │  SERVIDOR (Node runtime)                    │
                 │   · route handlers  app/api/**              │
                 │   · server actions                          │
                 │   · middleware.ts (guard fail-closed)       │
                 │   · lib/auth (jwt sign/verify, bcrypt)      │
                 │   · lib/db  (TypeORM DataSource singleton) ─┼──▶  PostgreSQL RDS
                 └─────────────────────────────────────────────┘        (SSL, prod)
```

**Mapa NestJS → Next (misma semántica, otras piezas):**

| Concepto (tu receta NestJS) | Equivalente en Next.js |
|---|---|
| `JwtModule.register({ secret })` | `lib/auth/jwt.ts` con `jsonwebtoken` (HS256), `JWT_SECRET_MANAGMENT` |
| `jwtService.sign(payload, { secret, expiresIn: '7d' })` | `signToken()` → `jwt.sign(payload, SECRET, { expiresIn: '7d' })` |
| `JwtStrategy` (Passport) verifica firma+exp | `verifyToken()` → `jwt.verify(token, SECRET)`; se llama en `middleware.ts` y en helpers de sesión |
| Guard global `APP_GUARD` + `@Public()` | `middleware.ts`: protege todo; lista de rutas públicas explícita (fail-closed) |
| `@Session()` (request.user) | `getSession()` server helper que lee/verifica el `Bearer`/cookie y devuelve `{ userId, email, role }` |
| 3 logins por rol (`/login`, `/login/admin`, …) | `POST /api/auth/login` y `POST /api/auth/login/admin` que validan `role` antes de firmar |
| `password select:false` + `addSelect` | Igual, con TypeORM en `lib/db` |
| `MFA_TEMP_SECRET` (token temporal 5m) | Reservado; MFA se difiere (ver Fase 4, opcional) |

**Detalle de token:** payload `{ sub, email, role, companyId? }`, HS256, `expiresIn: '7d'`. **Transporte:** cookie `httpOnly` `Secure` `SameSite=Lax` (recomendado para web, evita XSS que roba el token) **y/o** header `Authorization: Bearer`. El middleware lee la cookie; las llamadas fetch del cliente no necesitan manipular el token. Se documenta la decisión en Fase 4.

---

## 3. Modelo de datos (entidades TypeORM)

Todas las tablas nuevas con **prefijo `axis_`** para no colisionar con tablas existentes de la RDS compartida.

### `axis_user`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `email` | varchar unique | |
| `password` | varchar | **`select: false`** — hash bcrypt(10) |
| `name` | varchar | |
| `role` | enum `user` \| `admin` | default `user` |
| `mfaEnabled` | bool | default false (reservado) |
| `createdAt` / `updatedAt` | timestamptz | |

### `axis_product`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `slug` | varchar unique | p.ej. `axis-onyx` |
| `name` | varchar | |
| `subtitle` | varchar | |
| `descriptionEs` / `descriptionEn` | text | i18n en DB |
| `priceCents` | int | en COP (centavos) |
| `currency` | varchar | `COP` |
| `active` | bool | visible en tienda |
| `images` | jsonb | **claves de asset repetidas** ahora; URLs S3 después |
| `createdAt`/`updatedAt` | timestamptz | |

### `axis_inventory` (o columnas en product, ver Fase 3)
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `productId` | uuid FK | |
| `sku` | varchar unique | |
| `variant` | varchar | edición/acabado (Onyx/Aurum/Morpho…) |
| `stock` | int | |

### `axis_order` (Fase 7 — Wompi, scaffolding)
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `reference` | varchar unique | referencia enviada a Wompi |
| `userId` | uuid FK nullable | |
| `amountCents` | int | |
| `status` | enum `pending`\|`approved`\|`declined`\|`error` | |
| `wompiTransactionId` | varchar nullable | |
| `items` | jsonb | snapshot del carrito |
| `createdAt`/`updatedAt` | timestamptz | |

> **Nota de esquema:** al usar la RDS de prod, cada entidad se crea con una **migración revisada a mano** (no synchronize). El primer `migration:generate` se inspecciona línea por línea antes de correr.

---

## 4. Contrato de API (endpoints)

Públicos marcados con 🌐; el resto requieren sesión; 🔒admin requiere rol admin.

| Método | Ruta | Descripción |
|---|---|---|
| 🌐 `POST` | `/api/auth/login/admin` | valida role `admin`, bcrypt.compare, firma JWT 7d |
| `POST` | `/api/auth/logout` | limpia cookie |

> **Auth de cliente: eliminada.** `POST /api/auth/register`, `POST /api/auth/login`
> (role `user`) y `GET /api/auth/me` existieron y se borraron en la auditoría de
> seguridad: la tienda es de invitado, el único que necesita cuenta es el admin, y
> el frontend no consumía ninguna de las tres. Dejarlas abiertas solo aportaba
> superficie que auditar y una vía para llenar `axis_user` de filas basura
> (5/min/IP). El admin se crea con `scripts/seed.ts`. Si vuelven las cuentas de
> cliente, se reponen junto con `findById`/`emailExists` en `src/server/auth/users.ts`.
| 🌐 `GET` | `/api/products` | catálogo activo (tienda) |
| 🌐 `GET` | `/api/products/[slug]` | detalle |
| 🔒 `POST` | `/api/admin/products` | crear producto |
| 🔒 `PATCH` | `/api/admin/products/[id]` | editar (precio, stock, activo, imágenes) |
| 🔒 `DELETE` | `/api/admin/products/[id]` | baja (soft delete → `active:false`) |
| 🔒 `GET` | `/api/admin/inventory` | inventario / stock |
| `POST` | `/api/checkout/session` | (Fase 7) crea `axis_order` + firma de integridad Wompi |
| 🌐 `POST` | `/api/wompi/webhook` | (Fase 7) recibe eventos, verifica firma, actualiza order |

**Rate limiting** en los `/api/auth/*`: 5 intentos / minuto / IP (equivalente al `@Throttle` que describiste).

---

## 5. Variables de entorno

**Server-only (ya en `.env`, no tocar):** `JWT_SECRET_MANAGMENT`, `MFA_TEMP_SECRET`, `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_SSL`.

**A añadir cuando toque (server-only):** `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET`, `WOMPI_INTEGRITY_SECRET`.

**Públicas (`NEXT_PUBLIC_`, sí van al cliente):** `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` (Fase 7), y opcional `NEXT_PUBLIC_SITE_URL`.

> Nota de DB: para conectar a la RDS, `POSTGRES_SSL` distinto de `'false'` → SSL con `rejectUnauthorized: false` (RDS exige SSL con cert no estricto). `synchronize` **forzado a `false`** en código. `RUN_MIGRATIONS` controla si se corren migraciones al arrancar (en Next lo haremos por comando explícito, no al boot).

---

## 6. El paso a paso (fases)

Cada fase tiene **objetivo**, **pasos**, **archivos** y **criterio de aceptación**. Se ejecutan en orden; cada una debe compilar y verificarse antes de la siguiente.

### Fase 0 — Skeleton del monorepo
**Objetivo:** preparar la estructura sin romper nada.
**Pasos:**
1. `pnpm-workspace.yaml` con `apps/*` y `packages/*`.
2. Mover el proyecto Vite actual a `apps/web-legacy/` (respaldo de referencia) **o** trabajar la migración in-place — se decide al arrancar la Fase 1.
3. `packages/db` (entidades + migraciones + DataSource) y `packages/types` (tipos compartidos front/back).
**Aceptación:** `pnpm install` en la raíz resuelve el workspace; el sitio actual sigue arrancando.

### Fase 1 — Migración Vite → Next.js (paridad visual 1:1)
**Objetivo:** la landing actual se ve y anima **idéntica** sobre Next App Router.
**Pasos:**
1. Crear `apps/web` con Next 15 (App Router, React 19, Node runtime).
2. **Tailwind v4**: cambiar el plugin de Vite por `@tailwindcss/postcss`; portar `src/index.css` (tokens `@theme`, `.btn-axis`, `.eyebrow`, `.bg-morpho`, `.container-axis`) tal cual.
3. **Fuentes**: portar los `@fontsource*` (o migrar a `next/font` self-host). Mantener el anti-FOUC del tema (`data-theme` + `localStorage 'axis-theme'`) en el `<head>` del root layout.
4. **i18n**: montar `react-i18next` en un Client Provider; conservar `es.ts`/`en.ts` con **mismo shape** (`Dict = typeof es`). Nada hardcodeado.
5. **Smooth scroll / motion**: `SmoothScroll` (Lenis), `framer-motion`, `motion.ts` → Client Components. Honrar `prefers-reduced-motion`.
6. **Imágenes** (punto delicado): el pipeline `?picture` + `vite-imagetools` es específico de Vite. Migrar `<Img>` y `<ImageCarousel>` a **`next/image`** (AVIF/WebP automático, `sizes`, `lazy`, `width/height` intrínsecos = cero CLS, `priority` para el LCP del hero). Reescribir los imports de assets en Hero, Editions, Lifestyle, packaging, retail. Mantener `alt` desde `t.alt.*`.
7. **React Compiler**: activar `babel-plugin-react-compiler` en la config de Next (experimental). No añadir memoización manual.
8. Portar `App.tsx` → `app/page.tsx` (árbol de sections) + `app/layout.tsx`.
9. **TypeORM/Next**: `serverExternalPackages: ['typeorm']` en `next.config`, `reflect-metadata` importado una vez server-side, decoradores habilitados en tsconfig. (Se usa en Fase 3; se deja el config listo aquí.)
**Aceptación:** landing en Next pixel-parity con la de Vite; Lighthouse ≥ el actual; LCP < 2.5s; `pnpm build` sin errores de tipos.

### Fase 2 — Catálogo de 4 productos (modo test, imágenes repetidas)
**Objetivo:** una tienda con 4 gafas usando las imágenes que ya existen.
**Pasos:**
1. Definir los 4 productos de prueba (nombres alineados a las ediciones actuales):

   | Slug | Nombre | Imágenes (reutilizadas del repo) |
   |---|---|---|
   | `axis-onyx` | AXIS Onyx | `packaging/gafas-de-frente`, `hero/hero-producto`, `lifestyle/modelo-01` |
   | `axis-aurum` | AXIS Aurum | `hero/hero-producto-02`, `lifestyle/modelo-03`, `retail/axis-en-cafe` |
   | `axis-morpho` | AXIS Morpho | `packaging/empaque-abierto-con-gafas`, `lifestyle/modelo-05`, `lifestyle/modelo-07` |
   | `axis-clarum` | AXIS Clarum | `lifestyle/modelo-02`, `lifestyle/modelo-08`, `retail/axis-en-cafe-02` |

2. Rutas: `app/tienda/page.tsx` (grid de 4) y `app/tienda/[slug]/page.tsx` (detalle con carrusel + CTA).
3. **Fuente de datos:** los 4 productos se **siembran en la DB** (seed de la Fase 3) y la tienda los lee vía `/api/products`. Hasta que exista la DB, un `catalog.ts` temporal con los mismos 4 objetos permite maquetar. `images` guarda **claves de asset**, no URLs.
4. CTA por producto: por ahora "Reservar por WhatsApp" (`whatsappLink` con mensaje por modelo) + botón "Comprar" **deshabilitado / "Próximamente"** hasta Fase 7.
5. Enlazar la tienda desde el `Nav`.
**Aceptación:** `/tienda` muestra 4 gafas con imágenes repetidas; detalle navegable; i18n completo; se ve premium y coherente con la marca.

### Fase 3 — Capa de datos (TypeORM + RDS + migraciones)
**Objetivo:** conexión real a la RDS y esquema AXIS creado por migración.
**Pasos:**
1. `packages/db/data-source.ts`: `DataSource` con `type:'postgres'`, host/port/user/pass/db desde env, SSL condicional (`rejectUnauthorized:false`), **`synchronize:false` fijo**, `entities`, `migrations`.
2. **Singleton de conexión** para Next (evita abrir una conexión por request/HMR): cachear el `DataSource` en `globalThis`. Runtime **Node** (no edge) en todos los handlers que tocan DB.
3. Entidades: `AxisUser`, `AxisProduct`, `AxisInventory` (§3). `password` con `select:false`.
4. Scripts en `packages/db`: `migration:generate`, `migration:run`, `migration:revert`, `seed`.
5. **Primera migración**: generar, **revisar a mano** (que solo cree tablas `axis_*`, sin tocar nada existente), correr contra la RDS.
6. **Seed** de los 4 productos de la Fase 2.
**Aceptación:** las tablas `axis_*` existen en la RDS; el seed inserta 4 productos; `/api/products` los devuelve; ninguna tabla ajena fue modificada.

### Fase 4 — Autenticación
**Objetivo:** registro, login y sesión, replicando tu receta.
**Pasos:**
1. `lib/auth/password.ts`: `hash(plain,10)` / `compare`.
2. `lib/auth/jwt.ts`: `signToken({sub,email,role})` (HS256, `JWT_SECRET_MANAGMENT`, 7d) / `verifyToken`.
3. `POST /api/auth/register`: valida, hashea, crea `user`, firma token, set cookie httpOnly.
4. `POST /api/auth/login` y `/login/admin`: `findByEmail` con `addSelect('password')`, `compare`, **valida role**, firma, cookie. Errores estilo repo (mismo código para user-not-found y password mala, para no filtrar cuál falló). Rate limit 5/min/IP.
5. `getSession()` server helper: lee cookie/Bearer, `verifyToken`, devuelve `{userId,email,role}` o null.
6. `middleware.ts`: **fail-closed**. Lista de rutas públicas (`/`, `/tienda*`, `/login`, `/registro`, `/api/auth/*`, `/api/products*`, `/api/wompi/webhook`, assets). Todo lo demás exige sesión; `/admin*` y `/api/admin*` exigen `role==='admin'`.
7. `POST /api/auth/logout`, `GET /api/auth/me`.
8. (Opcional, diferido) MFA con `MFA_TEMP_SECRET` (tempToken 5m) — dejar el hueco, no implementar aún.
**Aceptación:** registro crea usuario en DB; login devuelve token válido 7d; un `user` NO entra por `/login/admin`; rutas protegidas responden 401 sin sesión; el JWT secret **no** aparece en el bundle cliente.

### Fase 5 — Cuenta de usuario (UI)
**Objetivo:** pantallas de auth y área de cuenta.
**Pasos:**
1. `app/registro` y `app/login`: formularios con el sistema visual AXIS (dorado en líneas, Morpho en hover del CTA), i18n, validación, estados de error.
2. `app/cuenta`: perfil básico (nombre, email), cerrar sesión. Protegida por middleware.
3. Estado de sesión en el `Nav`: mostrar "Iniciar sesión" o el nombre/menú del usuario.
**Aceptación:** flujo completo registro → login → cuenta → logout en el navegador; se ve premium; responsive.

### Fase 6 — Admin dashboard
**Objetivo:** panel para gestionar catálogo/inventario contra la DB real.
**Pasos:**
1. `app/admin/layout.tsx`: solo `role==='admin'` (doble check: middleware + server component).
2. `app/admin` (resumen), `app/admin/productos` (tabla CRUD), `app/admin/productos/[id]` (editar precio, stock, `active`, imágenes/claves), `app/admin/inventario` (stock por SKU).
3. Conectar a `/api/admin/*` (Fase 4/3). Mutaciones vía server actions o fetch con revalidación.
4. Crear el **primer usuario admin** por seed/migración controlada (o comando puntual), no por endpoint público.
5. UI sobria de dashboard (no necesita el brillo de la landing, pero mantiene tipografía/colores de marca).
**Aceptación:** un admin edita un producto y el cambio se refleja en `/tienda`; un `user` normal recibe 403 en `/admin`; los datos persisten en la RDS.

### Fase 7 — Checkout con Wompi (plan detallado, basado en docs.wompi.co)

**Decisiones tomadas:** **Web Checkout (redirect)** · **Comprar ahora + carrito localStorage** · **descuentos con precio tachado** (`compareAtPriceCop`).

**Cómo funciona Wompi (resumen de la doc):**
- Web Checkout = form GET a `https://checkout.wompi.co/p/` con `public-key`, `currency` (COP), `amount-in-cents`, `reference` (única), `signature:integrity` y opcionales (`redirect-url`, `expiration-time`, datos de cliente). Wompi muestra TODOS los métodos (tarjeta, Nequi, PSE, Bancolombia, etc.).
- **Firma de integridad** = `SHA256(reference + amountInCents + currency [+ expirationTime] + WOMPI_INTEGRITY_SECRET)` — SIEMPRE server-side.
- **Webhook** `transaction.updated`: verificar `signature.checksum` = `SHA256(valores de signature.properties en orden + timestamp + WOMPI_EVENTS_SECRET)` (propiedades extraídas DINÁMICAMENTE del evento). Responder 200 rápido; reintentos 30min/3h/24h → handler idempotente. El redirect NUNCA confirma un pago; el webhook (o `GET /v1/transactions/:id` con la llave pública) es la fuente de verdad.
- Sandbox: llaves `pub_test_/prv_test_/test_events_/test_integrity_` + `sandbox.wompi.co`. Tarjeta `4242 4242 4242 4242`→APPROVED, `4111...`→DECLINED; Nequi `3991111111`→APPROVED.

**Arquitectura del flujo (guest checkout):**
```
Detalle producto ──"Comprar ahora"──┐
Carrito (localStorage) ──"Pagar"────┴─▶ /tienda/checkout  (datos invitado + resumen)
    │  POST /api/checkout  { customer, shipping, items:[{productId, qty}] }   ← SIN precios del cliente
    ▼
Server: valida stock → precios DESDE LA DB → crea axis_order `pending` (snapshot) →
        firma integridad (reference, montoCentavos, COP, expiración 1h) →
        responde parámetros del Web Checkout
    │  (auto-submit form GET)
    ▼
checkout.wompi.co ── cliente paga ──▶ redirect a /tienda/pago/resultado?id=TX
    │                                     └─ server: GET /v1/transactions/:id → muestra estado real
    └─ Wompi POST /api/wompi/webhook (transaction.updated)
           └─ verificar checksum (timing-safe) → validar monto/moneda vs orden →
              APPROVED: pending→paid + descontar stock (transaccional, una sola vez)
              DECLINED/ERROR: pending→failed · VOIDED: →cancelled (+restock si estaba paid)
```

**Pasos:**
1. **Migración #2:** `axis_product.compareAtPriceCop` (int null, precio tachado) · `axis_order.paymentMethodType` (varchar null) · `axis_order.paidAt` (timestamptz null).
2. **`src/server/wompi.ts`:** `integritySignature()`, `verifyEventChecksum()` (propiedades dinámicas + `crypto.timingSafeEqual`), `fetchTransaction()` (API por entorno según prefijo de la llave), `checkoutParams()`.
3. **Checkout:** extender `createGuestOrder` + `POST /api/checkout` → responde `payment` (url, llave pública, reference, monto en centavos, firma, expiración, redirect).
4. **Webhook** `POST /api/wompi/webhook` (público, verificado por checksum): idempotente; valida `amount_in_cents === order.amountCop*100` y `currency` antes de marcar pagado; stock con `GREATest(stock-qty,0)` en transacción; VOIDED tras paid → restock.
5. **Carrito localStorage** (`axis-cart`): lib + badge en Nav + página `/tienda/carrito`.
6. **UI compra:** selector de cantidad + "Comprar ahora" + "Añadir al carrito" en el detalle; `/tienda/checkout` (formulario invitado bilingüe) con auto-redirect a Wompi.
7. **Resultado** `/tienda/pago/resultado?id=…`: consulta la transacción server-side y muestra estado real (aprobado/declinado/pendiente con refresh).
8. **Descuentos:** campo "precio anterior" en admin; tienda muestra tachado + badge −%.
9. **Pruebas:** simulación local del webhook (checksum válido con el secreto de eventos) verificando idempotencia y stock; E2E sandbox con tarjeta 4242; `grep` de secretos en `.next/static`.

**Variables de entorno (añadir a `apps/web/.env`):**
- `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` = `pub_test_...` (pública por diseño)
- `WOMPI_INTEGRITY_SECRET` = `test_integrity_...` (server-only)
- `WOMPI_EVENTS_SECRET` = `test_events_...` (server-only)
- `WOMPI_PRIVATE_KEY` = `prv_test_...` (server-only; para anulaciones/API futura, opcional hoy)
- `NEXT_PUBLIC_SITE_URL` = `http://localhost:3000` (prod: `https://axisvision.co`)
- En el dashboard de Wompi: **URL de eventos** → `https://axisvision.co/api/wompi/webhook` (sandbox y prod por separado; en local el webhook no llega — se prueba simulado o tras el deploy).

**Reglas de seguridad NO negociables:** el cliente jamás envía precios (server desde DB) · firma de integridad server-side · checksum del webhook verificado timing-safe ANTES de procesar · idempotencia (reintentos de Wompi no duplican stock ni estados) · monto+moneda del evento validados contra la orden · `expiration-time` 1h (una orden vieja no se paga a precio viejo) · secretos fuera del bundle (solo `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` y `NEXT_PUBLIC_SITE_URL` son públicos) · rate-limit en `/api/checkout` (ya existe).

**Aceptación:** compra sandbox completa (tarjeta 4242) → orden `paid` + stock descontado UNA vez aunque el webhook se repita; DECLINED → `failed` sin tocar stock; checksum inválido → 403; secretos ausentes de `.next/static`.

### Fase 8 — Hardening y futuro
- **S3**: migrar `images` de claves de asset locales → URLs S3 (subida desde el admin). El modelo `jsonb` ya lo soporta sin cambiar esquema.
- Seguridad: headers (CSP), `Secure`/`SameSite` en cookies, revisión de rate limits, logs.
- `/auth/refresh` para reemitir token con datos frescos (el JWT es stateless: role/companyId viajan dentro).
- Observabilidad y errores.

---

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Fuga de secretos al cliente (Next bundling) | Regla NEXT_PUBLIC_ + `grep` del secret en `.next/static` tras cada build. DB/JWT solo en server components/handlers. |
| Alterar el esquema de la RDS de prod | `synchronize:false` fijo; migraciones revisadas a mano; tablas con prefijo `axis_`; nunca correr synchronize. |
| TypeORM + Next (decoradores, bundling, conexiones) | `serverExternalPackages:['typeorm']`, `reflect-metadata` una vez, DataSource singleton en `globalThis`, runtime Node. |
| Pérdida de paridad visual al migrar de Vite | Fase 1 con criterio de "pixel-parity"; screenshots antes/después; portar CSS/tokens tal cual. |
| Pipeline de imágenes cambia (`?picture` → next/image) | Reescritura localizada en `<Img>`/`<ImageCarousel>`; mantener `sizes`, `priority`, `alt` i18n. |
| Datos de prueba confundidos con reales | Convención "modo test" en commits; los 4 productos y sus imágenes repetidas marcados como test hasta material real. |

---

## 8. Checklist rápido de arranque (cuando aprobemos el plan)

- [ ] Fase 0: `pnpm-workspace.yaml` + `packages/db` + `packages/types`
- [ ] Fase 1: `apps/web` Next con landing en paridad visual
- [ ] Fase 2: `/tienda` con 4 productos e imágenes repetidas
- [ ] Fase 3: TypeORM + migración `axis_*` en RDS + seed
- [ ] Fase 4: auth (register/login/middleware fail-closed)
- [ ] Fase 5: pantallas de cuenta
- [ ] Fase 6: admin dashboard CRUD inventario
- [ ] Fase 7: Wompi (sandbox) — próximamente
- [ ] Verificación: secretos ausentes del bundle; RDS intacta salvo tablas `axis_*`

---

## 9. Próximo paso

Con el plan aprobado, arrancamos por **Fase 0 + Fase 1** (skeleton del monorepo + migración a Next con paridad visual), porque todo lo demás (tienda, auth, admin, Wompi) depende de tener la app Next en pie. Commits en **modo test**.
