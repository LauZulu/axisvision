# AXIS — Vitrina comercial B2B

Landing de una página para **AXIS**, gafas con inteligencia artificial. Su objetivo es que
**ópticas, retailers y distribuidores** soliciten catálogo / precios mayoristas y se conviertan
en **punto de venta oficial**. Sin backend: la conversión es por **WhatsApp Business**.

> Estrategia, diseño y especificación completa: **[PLAN-AXIS.md](PLAN-AXIS.md)**.
> Guía para desarrollo asistido: **[CLAUDE.md](CLAUDE.md)**.

## Stack

- **Vite 8 + React 19 + TypeScript** (React Compiler activo)
- **Tailwind CSS v4** (tokens de marca en `src/index.css` → `@theme`)
- **Framer Motion** (animaciones) + **Lenis** (smooth scroll)
- **i18next / react-i18next** (ES por defecto · EN) — diccionarios en `src/i18n`
- Fuentes self-host (**Inter Tight · Cormorant Garamond · DM Sans · DM Mono**)

## Comandos

```bash
pnpm install
pnpm dev       # desarrollo (HMR)
pnpm build     # type-check + build de producción
pnpm preview   # servir el build
pnpm lint      # ESLint
```

## Estructura

```
src/
  components/ui/   TreeLogo (árbol filogenético), GlassesArt, Icon, Reveal, CountUp, SectionHeading
  sections/        Nav, Hero, WhatIsAxis, ProductShowcase, Capabilities, Clinical,
                   BusinessOpportunity, PartnerProgram, TrustSignals, Editions,
                   ConsumerStrip, FaqCommercial, ContactCommercial, Footer
  i18n/            es.ts, en.ts, useDict, init i18next
  lib/             SmoothScroll (Lenis), scrollContext, motion (variants)
  config/          brand.ts  ← WhatsApp, catálogo, mensajes por tipo de comprador
```

## Pendiente del cliente (marcado con `TODO[AXIS]`)

1. **WhatsApp Business** → `src/config/brand.ts` (`WHATSAPP_NUMBER`).
2. **Catálogo PDF** → colocar en `public/` y ajustar `CATALOG_URL`.
3. **Fotografía de producto** → reemplazar `GlassesArt` (placeholder line-art) por fotos reales en `src/assets/product/`.
4. **Logo árbol en SVG** real (si se desea sustituir el reconstruido) en `src/assets/brand/`.
5. **Imagen Open Graph** → `public/og-image.jpg` (referenciada en `index.html`).
6. Datos reales de **garantía, aliado clínico y registro de marca** en `src/i18n/*.ts`.
