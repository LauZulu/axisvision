# Assets de AXIS — dónde va cada imagen

Guía única para depositar imágenes/recursos. Suelta los archivos en la carpeta
correspondiente con el nombre indicado y avísame: yo los implemento con
**responsive (AVIF/WebP + `srcset`), `lazy-load`, `alt` bilingüe y sin CLS**.

## Regla rápida: ¿`src/assets/` o `public/`?

- **`src/assets/…` (aquí)** → todo lo que se muestra DENTRO de la página. Vite lo
  optimiza, versiona y permite generar variantes responsive. **El 95% va aquí.**
- **`public/…`** → solo URLs fijas: catálogo PDF, imagen Open Graph, favicon.

## Formato y calidad (importante)

- Entrega el **ORIGINAL en la máxima resolución** que tengas (ideal ≥ 2400px de
  ancho para fotos grandes). Yo genero desde ahí las versiones pequeñas y los
  formatos modernos. **No reduzcas tú la calidad.**
- Fotos: `.jpg`/`.png` (o `.webp`/`.avif` si ya los tienes). Logos/iconos: **`.svg`** siempre que se pueda.
- Nombres en **minúsculas-con-guiones**, sin espacios, sin acentos, sin `ñ`.
  Ej: `modelo-traduccion-01.jpg` (no `Modelo Traducción 1.JPG`).

> ⚠️ Para que las imágenes NO se borren entre sesiones, este repo necesita que los
> archivos estén versionados en git (un proceso de limpieza elimina lo no trackeado).
> Tras soltar un lote, hay que hacer commit. Avísame y lo dejo trackeado.

---

## Mapa de carpetas

### `brand/` — logo y sello (el árbol filogenético)
SVG vectorial preferido (nitidez + animación de trazo).
- `logo-horizontal.svg` — árbol + "AXIS" (nav y footer)
- `isotipo.svg` — solo el árbol (favicon, watermark, sello)
- `sello-punto-venta.svg` — árbol en círculo: "Punto de Venta Oficial AXIS"
- `logo-mono-claro.svg` / `logo-mono-oscuro.svg` — versiones monocromas

### `hero/` — portada / cover
La imagen heroica del producto sobre fondo carbón, luz lateral dramática.
- `hero-producto.jpg` — toma principal del hero (ángulo 3/4)
- `hero-fondo.jpg` — (opcional) fondo/ambiente del hero

### `product/` — galería y despiece del producto
Tomas de catálogo y detalles. Prefijo según tipo:
- Ángulos: `angle-frontal.jpg`, `angle-3-4.jpg`, `angle-lateral.jpg`
- Detalles: `detail-camara.jpg`, `detail-bisagra.jpg`, `detail-audio.jpg`,
  `detail-grabado.jpg`, `detail-sensor.jpg`, `detail-carga.jpg`
- Estuche: `estuche-abierto.jpg`, `estuche-cerrado.jpg`

### `capabilities/` — visual por capacidad (sección 4)
Una imagen/demo por capacidad. Nombre = la capacidad:
- `video.jpg` · `foto.jpg` · `asistente-ia.jpg` · `traduccion.jpg` ·
  `audio-open-ear.jpg` · `lentes-formula.jpg` · `autonomia.jpg` · `privacidad.jpg`

### `lifestyle/` — modelos llevando el producto
Personas usando AXIS en contexto real.
- `modelo-01.jpg`, `modelo-02.jpg` … (numeradas)
- O por escena: `modelo-traduccion.jpg`, `modelo-ciudad.jpg`, `modelo-foto.jpg`

### `editions/` — acabados / colores
Cada edición sobre fondo neutro. Nombre = el acabado:
- `edicion-onyx.jpg`, `edicion-oro.jpg`, `edicion-titanio.jpg` …

### `packaging/` — empaque premium
- `empaque-cerrado.jpg`, `empaque-abierto.jpg`

### `retail/` — producto en óptica / expositor (oro puro B2B)
- `expositor-optica.jpg`, `display-mostrador.jpg`
  (si no hay foto real, marco "mockup provisional")

### `press/` — logos de prensa, aliados y certificaciones
Preferible **SVG monocromo**.
- `prensa-<nombre>.svg`, `aliado-clinico.svg`, `certificacion-<nombre>.svg`

### `icons/` — iconos sueltos (solo si NO usamos el sprite)
Familia de trazo fino dorado. Por defecto el plan usa un sprite SVG;
deja aquí iconos individuales solo si los aportas como archivos.

---

## Lo que va en `public/` (NO aquí)

| Archivo | Para qué |
|---|---|
| `public/catalogo-axis.pdf` | Catálogo descargable (ya referenciado en `src/config/brand.ts → CATALOG_URL`) |
| `public/og-image.jpg` | Imagen al compartir en redes (1200×630, referenciada en `index.html`) |
| `public/favicon.svg` | Ya existe |
