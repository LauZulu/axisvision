# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es este proyecto

**AXIS** es una marca de **gafas con inteligencia artificial**. Este repo es su **vitrina comercial B2B** (landing de una sola página, en español con interruptor a inglés).

**Objetivo #1:** convencer a **ópticas, retailers y distribuidores** de que compren y **revendan** AXIS, y llevarlos a un **contacto comercial** (solicitar catálogo / precios mayoristas / ser punto de venta oficial). El B2C (consumidor final) coexiste pero **nunca** resta fuerza al mensaje mayorista.

**Es vitrina:** SIN backend, SIN base de datos, SIN checkout. La conversión es lead generation, no venta directa.

> **`PLAN-AXIS.md` es la fuente de verdad.** Antes de construir o cambiar cualquier sección, lee `PLAN-AXIS.md`: contiene la estrategia B2B, el mapa de sitio (14 secciones), el inventario de assets, el plan de animación, la especificación sección por sección, el sistema de diseño con tokens exactos y las decisiones confirmadas. Este CLAUDE.md resume las restricciones; el plan tiene el detalle.

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
- **Imágenes responsive:** `vite-imagetools` (ver "Imágenes y assets").
- **Contacto:** todo sale de `src/config/brand.ts` (`WHATSAPP_NUMBER`, `SALES_EMAIL`, `whatsappLink()`). Hoy: WhatsApp `+57 312 3727253` y `contacto@axisvision.co`. Única vía confirmada: **WhatsApp Business** (sin formulario backend).

## Estructura del repo

```
src/
  components/ui/   Reutilizables: TreeLogo, GlassesArt, Icon, Reveal, CountUp,
                   SectionHeading, Img, ImageCarousel
  sections/        Una por sección (Nav, Hero, WhatIsAxis, ProductShowcase,
                   Capabilities, Specs, Clinical, BusinessOpportunity,
                   PartnerProgram, TrustSignals, ShowcaseBanner, Editions,
                   Lifestyle, ConsumerStrip, FaqCommercial, ContactCommercial, Footer)
  i18n/            es.ts, en.ts, index.ts (init i18next), useDict.ts
  lib/             SmoothScroll (Lenis), scrollContext, motion (variants/easings)
  config/          brand.ts (WhatsApp, correo, catálogo)
  assets/          imágenes por categoría (ver abajo) + README.md
  images.d.ts      tipos de los imports `?picture` (ResponsivePicture)
  index.css        Tailwind + tokens (@theme) + componentes
public/            favicon.svg · catalogo-axis.pdf · og-image.jpg
```

## Imágenes y assets — organización y nomenclatura

> Guía completa carpeta por carpeta y con ejemplos: **`src/assets/README.md`**. Resumen:

**Dónde va cada imagen:**
- **`src/assets/<categoría>/`** → todo lo que se muestra en la página (Vite la optimiza, versiona y genera variantes responsive). **El 95% va aquí.**
- **`public/`** → solo URLs fijas: `catalogo-axis.pdf` (`CATALOG_URL`), `og-image.jpg` (1200×630, referida en `index.html`), `favicon.svg`.

**Categorías (carpetas):** `brand/` (logo/sello SVG) · `hero/` (portada) · `product/` (ángulos `angle-*`, detalles `detail-*`, estuche) · `capabilities/` (una por capacidad) · `lifestyle/` (modelos llevando el producto) · `editions/` (acabados) · `packaging/` (empaque) · `retail/` (expositor/contexto) · `press/` (prensa/aliados/certificaciones) · `icons/`.

**Nomenclatura:** minúsculas-con-guiones, sin espacios/acentos/ñ (ej. `modelo-traduccion-01.jpg`). Originales en **máxima resolución** (ideal ≥2400px de ancho); las variantes chicas las genera el build. Logos/iconos en **`.svg`** cuando se pueda.

**Pipeline responsive (úsalo SIEMPRE para imágenes):**
- Importa con el sufijo `?picture` y renderiza con `<Img>`:
  ```tsx
  import foto from '../assets/hero/hero-producto-02.jpeg?picture'
  import { Img } from '../components/ui/Img'
  <Img picture={foto} alt={t.alt.heroProduct} sizes="(min-width:768px) 48vw, 100vw" priority />
  ```
- `vite-imagetools` (`vite.config.ts → defaultDirectives`) genera **AVIF + WebP + JPEG** en 4 anchos (480/768/1200/1920), `quality:70`, con `srcset`.
- `<Img>` (`src/components/ui/Img.tsx`) envuelve `<picture>`, lleva `width/height` intrínsecos (cero CLS), `loading="lazy"` por defecto y `priority` para el LCP (hero). `alt` SIEMPRE desde i18n (`t.alt.*`).
- **Carrusel:** `<ImageCarousel>` (`src/components/ui/ImageCarousel.tsx`) — auto-rota con disolver suave (todas las slides montadas para no parpadear; la anterior se desvanece + desenfoca por encima). Con `fit="contain"` rellena los márgenes con la misma foto borrosa y **oscurecida con `brightness`** (no `opacity`, para que borde e imagen se desvanezcan a la par).

## Pendiente (assets reales del cliente · `TODO[AXIS]`)

- **Logo árbol SVG oficial** → hoy `TreeLogo` es una reconstrucción vectorial; si llega el SVG exacto, reemplaza los trazos manteniendo el `viewBox`. Archivo en `src/assets/brand/`.
- **Catálogo PDF** → `public/catalogo-axis.pdf` (ajustar `CATALOG_URL`).
- **Imagen Open Graph** → `public/og-image.jpg`.
- **Fotos de ediciones** (cada acabado sobre fondo neutro) → `editions/` (hoy usan el line-art `GlassesArt`).
- **Datos reales** de garantía, aliado clínico y registro de marca → `src/i18n/*.ts`.

## Sistema de diseño — usar los valores EXACTOS

Identidad visual no negociable (detalle y reglas de uso en `PLAN-AXIS.md` §7):

- **Negro carbón** `#0A0A0A` / `#0D0D0D` — fondo base (nunca negro puro).
- **Dorado antiguo** `#C8A96E` — SOLO líneas finas, etiquetas, contornos y el símbolo de marca. **Nunca** rellenos grandes.
- **Dorado profundo** `#8B6B35` — detalle.
- **Blanco cálido** `#F5F3EE` — una **única** sección de "luz" (zona técnica/comercial).
- **Gris cálido** `#D8D6CF` — texto cuerpo, 18-20px, line-height 1.6.
- **Iridiscencia Morpho** (el azul elegante, firma cromática distintiva) — gradiente `#1A3A8A → #2A5ADA → #2A1A4A → #0A0A1F`. **Único color vibrante** sobre carbón+dorado. Uso **raro = magia** (2-4 veces en toda la página): destello del hero, hover de CTAs, momentos clave. Nunca fondo plano dominante, nunca decoración floral.

**Logo / sello recurrente:** el **símbolo dorado de AXIS** — un **árbol-runa** (tronco en Y, rama izquierda larga y un doble chevron anidado en la rama derecha), implementado como SVG en `src/components/ui/TreeLogo.tsx` (con animación de dibujado del trazo y `currentColor` para heredar el dorado). Es el sello central (nav, footer, watermark del hero/contacto). El alma de origen (evolución, "una nueva forma de ver el mundo") vive como ADN sutil en el logo y la elegancia, **no** como decoración. *Nota:* el `TreeLogo` actual es una reconstrucción vectorial fiel; si llega el SVG oficial exacto, sustituir los trazos manteniendo el `viewBox`.

**Tipografía (ruta híbrida confirmada):** **Inter Tight** (titulares/columna corporativa-tech) + **Cormorant Garamond** (solo hero y 1-2 frases manifiesto = alma de lujo) + **DM Sans** (cuerpo) + **DM Mono** (etiquetas/eyebrows en MAYÚSCULAS doradas con tracking amplio 0.15-0.25em).

## Restricciones que no se deben romper

- **Sin backend / sin base de datos / sin checkout.** Todo es estático; la conversión es el contacto comercial.
- **Prioridad B2B** sobre B2C en jerarquía visual y de copy.
- **Bilingüe ES/EN** con español por defecto; nada de texto hardcodeado.
- **Mobile-first** y 60fps; el lujo no puede costar rendimiento (imágenes responsive AVIF/WebP + lazy, LCP < 2.5s).
- **Imágenes SIEMPRE por el pipeline:** importar con `?picture` y renderizar con `<Img>` (o `<ImageCarousel>`), con `alt` desde i18n. No usar `<img src>` crudo de un asset pesado ni `background-image` para fotos. Respetar la organización y nomenclatura de `src/assets/README.md`.
- Dorado solo en líneas/contornos; Morpho solo en destellos puntuales.
