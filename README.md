# AXIS Vision

Sitio de **AXIS**, gafas con inteligencia artificial: landing de marca + **tienda** con
checkout de invitado y **panel de administración**. En español con interruptor a inglés.

El objetivo es el **usuario final** (persona natural). No hay mensaje mayorista.

> - **`CLAUDE.md`** — cómo funciona todo y por qué. Es la fuente de verdad viva; empieza ahí.
> - **`PENDIENTES.md`** — lo que falta para operar de verdad, y quién puede hacerlo.
> - **`PLAN-PLATAFORMA.md`** — histórico: el plan de la migración de vitrina a plataforma.

## Stack

- **Monorepo pnpm** — `apps/web` (todo el sitio), `packages/*` (placeholders).
- **Next.js 15** (App Router) + **React 19** + **TypeScript**, React Compiler activo.
- **Tailwind CSS v4** (tokens de marca en `apps/web/app/globals.css` → `@theme`).
- **Framer Motion** + **Lenis** (scroll suave). Solo `transform`/`opacity`; se respeta
  `prefers-reduced-motion`.
- **TypeORM + Postgres (RDS)**, `synchronize: false` — el esquema solo se mueve con migraciones.
- **S3 privado + CloudFront** para todas las imágenes; el admin sube directo con presigned URLs.
- **Wompi** (pagos) y **Brevo** (correo transaccional).
- **i18next** con diccionarios TypeScript (`src/i18n/es.ts` y `en.ts`, mismo shape).
- Fuentes self-host: Inter Tight · Cormorant Garamond · DM Sans · DM Mono.

## Comandos

Desde la raíz:

```bash
pnpm install
pnpm dev       # desarrollo
pnpm build     # build de producción (incluye type-check)
pnpm start     # servir el build
pnpm lint      # ESLint
```

Desde `apps/web` (base de datos, imágenes, correo, pagos):

```bash
pnpm db:check           # comprueba la conexión con la RDS
pnpm db:migrate         # aplica migraciones pendientes
pnpm db:seed            # datos iniciales
pnpm inventory:import   # importa/resincroniza el inventario desde el Excel
pnpm images:upload      # sube las fotos de `fotos-para-subir/` a S3
pnpm s3:check           # comprueba acceso al bucket
pnpm email:preview      # renderiza las plantillas de correo en `.email-preview/`
pnpm payments:reconcile # cuadra pedidos pendientes contra Wompi
```

## Estructura

```
apps/web/
  app/            rutas: landing, tienda/**, admin/**, reservas/**, api/**
  src/
    components/   ui/ (reutilizables), store/ (tienda), admin/ (panel)
    sections/     una por sección de la landing
    server/       backend: db/ (TypeORM, entidades y migraciones), auth/, products,
                  admin, inventory, lenses, checkout, wompi, payments, waitlist, s3, email/
    lib/          cart, products, lenses, cdn, siteImages, motion, storeMode
    i18n/         es.ts, en.ts
    config/       brand.ts (WhatsApp, correo)
  scripts/        migración, seed, inventario, imágenes, pruebas
  public/         favicon.svg y logo-axis.svg — ninguna foto vive en el repo
```

## Configuración

Todas las variables viven en **`apps/web/.env`**. Los nombres y para qué sirve cada una están
en `apps/web/.env.example` (versionado, sin valores). La conexión a la RDS es **directa**, sin
túnel.

**Modo tienda:** `NEXT_PUBLIC_STORE_MODE=live` abre la compra; cualquier otro valor —o que falte
alguna llave de Wompi— la deja en modo reserva (solo dejar el correo). El fallback inseguro sería
cobrar sin pasarela, así que por defecto no se cobra. Es una variable `NEXT_PUBLIC_`: se hornea en
el build, o sea que cambiarla exige **volver a desplegar**.

## Despliegue

Vercel, con `apps/web` como raíz del proyecto. Dos cosas que no son opcionales:

- El entorno del hosting es **independiente** del `.env` local: las variables hay que ponerlas
  también allí.
- `experimental.serverMinification: false` en `next.config.ts` **no se quita**: TypeORM identifica
  las entidades por el nombre de la clase y el minificador las renombraba todas a una letra, lo
  que reventaba escrituras solo en producción. El porqué completo está en `CLAUDE.md`.
