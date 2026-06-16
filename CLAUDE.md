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

## Pendiente de añadir (según el plan, aún no instalado)

El repo es todavía el template base de Vite (`src/App.tsx` es el starter por defecto). Al construir, el plan define este stack:

- **Estilos:** Tailwind CSS v4 con los tokens del plan mapeados a variables CSS.
- **Animación:** `framer-motion` + `lenis` (smooth scroll). `gsap`/ScrollTrigger solo si un pin complejo lo exige. Solo animar `transform`/`opacity`; honrar `prefers-reduced-motion`.
- **i18n:** `react-i18next` con diccionarios `es.json` / `en.json`. **Español por defecto.** No hardcodear texto visible — todo pasa por i18n desde el día 1.
- **Fuentes self-host** vía `@fontsource`.
- **Conversión:** la única vía de contacto confirmada es **WhatsApp Business** (enlace `wa.me` con mensaje prerellenado por tipo de comprador). No hay formulario backend.

Estructura de carpetas propuesta (ver `PLAN-AXIS.md` §8): `src/components`, `src/sections`, `src/i18n`, `src/lib`, `src/styles`, `src/assets`.

## Sistema de diseño — usar los valores EXACTOS

Identidad visual no negociable (detalle y reglas de uso en `PLAN-AXIS.md` §7):

- **Negro carbón** `#0A0A0A` / `#0D0D0D` — fondo base (nunca negro puro).
- **Dorado antiguo** `#C8A96E` — SOLO líneas finas, etiquetas, contornos y el árbol filogenético. **Nunca** rellenos grandes.
- **Dorado profundo** `#8B6B35` — detalle.
- **Blanco cálido** `#F5F3EE` — una **única** sección de "luz" (zona técnica/comercial).
- **Gris cálido** `#D8D6CF` — texto cuerpo, 18-20px, line-height 1.6.
- **Iridiscencia Morpho** (el azul elegante, firma cromática distintiva) — gradiente `#1A3A8A → #2A5ADA → #2A1A4A → #0A0A1F`. **Único color vibrante** sobre carbón+dorado. Uso **raro = magia** (2-4 veces en toda la página): destello del hero, hover de CTAs, momentos clave. Nunca fondo plano dominante, nunca decoración floral.

**Logo / sello recurrente:** el **árbol filogenético dorado** (árbol de la vida, cladograma de líneas finas) es el símbolo central de la marca. El alma de origen (evolución, "una nueva forma de ver el mundo") vive como ADN sutil en el logo y la elegancia, **no** como decoración.

**Tipografía (ruta híbrida confirmada):** **Inter Tight** (titulares/columna corporativa-tech) + **Cormorant Garamond** (solo hero y 1-2 frases manifiesto = alma de lujo) + **DM Sans** (cuerpo) + **DM Mono** (etiquetas/eyebrows en MAYÚSCULAS doradas con tracking amplio 0.15-0.25em).

## Restricciones que no se deben romper

- **Sin backend / sin base de datos / sin checkout.** Todo es estático; la conversión es el contacto comercial.
- **Prioridad B2B** sobre B2C en jerarquía visual y de copy.
- **Bilingüe ES/EN** con español por defecto; nada de texto hardcodeado.
- **Mobile-first** y 60fps; el lujo no puede costar rendimiento (imágenes responsive AVIF/WebP + lazy, LCP < 2.5s).
- Dorado solo en líneas/contornos; Morpho solo en destellos puntuales.
