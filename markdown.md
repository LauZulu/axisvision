# Estrategia — AXIS Vision: giro B2B → B2C + modo claro/oscuro

> Documento para tu aprobación. **Todavía no he tocado ni una línea de código.**
> Cuando lo apruebes (o me digas qué cambiar), lo ejecuto.

---

## 1. Qué me pediste (resumen)

1. **Ya no es B2B, es B2C.** Quitar todo el mensaje dirigido a empresas (ópticas, retailers, distribuidores, mayoristas, "punto de venta", "margen", "reventa", "tu cliente"). Hablarle **solo al usuario final / persona natural**.
2. **Garantía: de 24 meses → 6 meses.**
3. **Modo oscuro (por defecto) + modo claro**, con interruptor para cambiar.
4. **Página más concisa** (menos secciones, menos texto).
5. Guardar esta estrategia y explicarte cómo lo haré, para aprobar.

---

## 2. Diagnóstico — qué hay hoy

La página es una vitrina **mayorista**. El giro no es cosmético: buena parte del sitio *existe solo para vender a ópticas*. Hoy son **16 secciones** (`src/App.tsx`):

| # | Sección | Enfoque hoy | Destino B2C |
|---|---------|-------------|-------------|
| 1 | Nav | CTA "Ser punto de venta", link "Negocio" | **Reescribir** CTA → "Comprar" / "Reservar" |
| 2 | Hero | "Diseñadas para venderse", "Conviértete en punto de venta" | **Reescribir** a deseo del usuario |
| 3 | WhatIsAxis | Neutral (qué es AXIS) | **Mantener** (ligeros ajustes) |
| 4 | ProductShowcase | "gafa que tu cliente quiere llevar" | **Mantener** + limpiar copy |
| 5 | Capabilities | "más fácil de vender", "por tu cliente" | **Mantener** + reescribir a "para ti" |
| 6 | Specs | Neutral | **Mantener** |
| 7 | Clinical | "entra en tu terreno con aval" | **Mantener** como prueba (óptica real) |
| 8 | **BusinessOpportunity** | Margen, PVP, inventario, exclusividad | **ELIMINAR** (100% B2B) |
| 9 | **PartnerProgram** | Kit de punto de venta, formación | **ELIMINAR** (100% B2B) |
| 10 | TrustSignals | "empresa que responde", suministro, reposición | **ELIMINAR o fundir** en garantía B2C |
| 11 | ShowcaseBanner | Banner visual | **Mantener** |
| 12 | Editions | "lista para tu vitrina", "surtido para vender más" | **Mantener** + reescribir copy |
| 13 | Lifestyle | "prueba de que tu cliente lo va a querer" | **Mantener** + reescribir |
| 14 | **ConsumerStrip** | "¿No tienes óptica? lista de espera" | **ELIMINAR** (el B2C ya es el sitio entero) |
| 15 | **FaqCommercial** | "Lo que toda óptica pregunta", margen, territorio | **Reemplazar** por FAQ de consumidor |
| 16 | **ContactCommercial** | "precios mayoristas, tu zona" | **Reemplazar** por compra/reserva B2C |

**La garantía "24 meses" aparece en 4 sitios:** `business.stats`, `trust.signals`, `faq`, y `hero.trust` ("Garantía internacional"). Los cuatro cambian a **6 meses**.

---

## 3. Estructura nueva propuesta (más concisa)

De **16 → 11 secciones**. Elimino las 4 puramente mayoristas y consolido:

```
1.  Nav            (CTA: "Reservar AXIS")
2.  Hero           (deseo personal, no "vendible")
3.  WhatIsAxis
4.  ProductShowcase
5.  Capabilities   ("todo lo que AXIS hace por ti")
6.  Specs
7.  Clinical       (óptica real = tu graduación, no un gadget)
8.  ShowcaseBanner
9.  Editions       (elige tu acabado)
10. Lifestyle      (así se ve puesta)
11. Garantía+Confianza  (fusiona TrustSignals en clave B2C: 6 meses, marca registrada, soporte)
12. FAQ            (preguntas de comprador)
13. Comprar/Contacto (WhatsApp para comprar / reservar)
14. Footer
```

> Nota: si prefieres aún **más corto**, puedo también fundir Specs dentro de Capabilities y quitar ShowcaseBanner. Dímelo y lo hago. Mi recomendación es la de arriba: concisa pero sin perder la prueba de producto.

---

## 4. Cambios de mensaje (B2B → B2C)

Regla general: **desaparecen** estas palabras/ideas y se reemplazan por lenguaje de usuario final.

| Sale (B2B) | Entra (B2C) |
|------------|-------------|
| "tu cliente", "para tu cliente" | "para ti", "tú" |
| "vender", "más fácil de vender", "diseñadas para venderse" | "vivir", "llevar puesta", "usar" |
| "punto de venta", "ser punto de venta" | "reservar", "comprar" |
| "margen", "PVP", "precios mayoristas" | (se elimina) |
| "óptica", "retailer", "distribuidor" | "tú" / (se elimina la selección de tipo) |
| "tu vitrina", "surtido para vender más" | "tu estilo", "elige el tuyo" |
| "empresa que responde", "capacidad de suministro" | "respaldo real", "soporte cuando lo necesites" |

Ejemplos concretos de reescritura del Hero:
- Subtítulo: ~~"…lentes con tu fórmula. **Diseñadas para venderse**."~~ → "…lentes con tu fórmula. **Hechas para llevarse puestas todo el día**."
- CTA primario: ~~"Conviértete en punto de venta"~~ → **"Reservar AXIS"**
- `hero.trust`: ~~"Garantía internacional"~~ → **"6 meses de garantía"**

Todo esto vive en **`src/i18n/es.ts` y `src/i18n/en.ts`** (deben mantener el mismo *shape*, es un requisito del tipado). También limpio los `alt` de imágenes que mencionan al cliente/vitrina.

---

## 5. Garantía → 6 meses

Cambio literal en los 4 puntos:
- `business.stats` → se elimina con la sección; el dato "6 meses de garantía" pasa a la nueva sección **Garantía+Confianza**.
- `trust.signals[0]` → "6 meses de cobertura para ti."
- `faq` → "Garantía de 6 meses, con soporte directo."
- `hero.trust[0]` → "6 meses de garantía."

---

## 6. Modo oscuro (default) + modo claro

**Situación actual:** el sitio es *solo oscuro*. Los colores están cableados directo (`bg-carbon-900`, `text-warm-white`, `text-warm-gray`) apuntando a tokens de `@theme` en `src/index.css`. No hay capa de "tema".

**Cómo lo implemento (recomendado):**

1. **Tokens semánticos.** Introduzco variables de rol —`--color-bg`, `--color-surface`, `--color-text`, `--color-heading`, `--color-hairline`— que en oscuro apuntan a los valores carbón/blanco-cálido actuales.
2. **Override de modo claro** bajo `:root[data-theme="light"]` en `index.css`: fondo blanco cálido (`#F5F3EE`), texto carbón, hairlines suaves. **El dorado y el Morpho no cambian** — son la firma de marca y funcionan en ambos fondos.
3. **`<html data-theme="dark">` por defecto.** Un pequeño script en `index.html` lee `localStorage` antes del render para evitar parpadeo (FOUC). Sin preferencia guardada → **oscuro**.
4. **Interruptor en el Nav**, junto al selector ES/EN (sol/luna). Persiste la elección en `localStorage`.
5. Ajusto las secciones que asumen fondo oscuro (bordes `white/5`, la sección "de luz" de Capabilities que ya es clara) para que respondan al tema.

**Decisión que necesito de ti (tradeoff):**
- **Opción A (recomendada):** migrar las clases de color a los tokens semánticos → modo claro *correcto y coherente* en todo el sitio. Toca casi todas las secciones, pero es lo bien hecho.
- **Opción B (rápida):** invertir los valores de los tokens actuales bajo `data-theme="light"` sin renombrar clases. Menos trabajo, pero los nombres quedan engañosos (`carbon-900` valiendo "claro") y es más frágil.

Voy con **A** salvo que me digas lo contrario.

---

## 7. Nombre / marca

El sitio dice "AXIS" en todas partes. Dijiste "**Axis Vision**". Confírmame:
- ¿Renombro la marca visible a **"AXIS Vision"** (nav, footer, títulos)? ¿O el logotipo sigue siendo "AXIS" a secas y "Vision" es solo el nombre del proyecto/dominio (`axisvision.co`)?

Por defecto asumo **logo = "AXIS"**, y uso "AXIS Vision" solo en `<title>`/meta, salvo que quieras el cambio completo.

---

## 8. Plan de ejecución (cuando apruebes)

1. `src/i18n/es.ts` + `en.ts` — reescribir todo el copy a B2C, garantía 6 meses, nueva FAQ y sección de compra, quitar claves B2B. *(el grueso del trabajo está aquí)*
2. `src/App.tsx` — quitar las secciones eliminadas, reordenar.
3. `src/sections/Nav.tsx` + `Footer.tsx` — CTAs, links y menú a B2C + toggle de tema.
4. Nueva sección **Garantía+Confianza** (o adaptar `TrustSignals`), nueva **Comprar** (adaptar `ContactCommercial`), nueva **FAQ** de consumidor.
5. `src/index.css` + `index.html` + `main.tsx` — tokens semánticos, tema claro, toggle, anti-FOUC.
6. `src/config/brand.ts` — revisar `whatsappLink('b2c')` como vía principal.
7. Borrar los archivos de secciones muertas (`BusinessOpportunity.tsx`, `PartnerProgram.tsx`, `ConsumerStrip.tsx`).
8. `pnpm build` (corre `tsc -b`) + `pnpm lint` para verificar tipos y que ambos diccionarios cuadren.
9. Actualizar `CLAUDE.md`/`PLAN-AXIS.md` para que dejen de decir "B2B" (opcional, si quieres).

---

## 9. Lo que necesito que apruebes / decidas

- [ ] **Estructura de secciones** de §3 (¿quito más? ¿fusiono Specs?).
- [ ] **Modo claro: Opción A (recomendada) o B** de §6.
- [ ] **Marca:** ¿"AXIS" o "AXIS Vision" en el logo? (§7)
- [ ] ¿La conversión sigue siendo **WhatsApp** (comprar/reservar), sin checkout? (asumo que sí).

Dame el visto bueno o tus ajustes y arranco.
