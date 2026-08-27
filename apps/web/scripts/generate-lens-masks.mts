import './_env'
import 'reflect-metadata'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { buildDataSource } from '../src/server/db/data-source'
import { AxisProduct } from '../src/server/db/entities/Product'
import { AxisProductImage } from '../src/server/db/entities/ProductImage'
import { cdnUrl } from '../src/lib/cdn'

/**
 * Extrae la silueta del LENTE de cada foto y la guarda en
 * `axis_product_image.lensMask`, que es lo que le permite a la tienda teñir una
 * sola foto y ahorrarse una variante por cada tipo de lente.
 *
 *   pnpm images:masks [--dry] [--only <slug>] [--clear] [--debug <carpeta>]
 *   pnpm images:masks --files <carpeta> [--debug <carpeta>]   ← sin base de datos
 *
 * NADIE dibuja la máscara. En una foto de estudio el lente transparente es una
 * isla clara encerrada por el aro oscuro, así que sale sola:
 *
 *   1. umbral Otsu       → armazón en negro, fondo y lente en blanco
 *   2. relleno del fondo → se apaga todo lo blanco conectado con las 4 esquinas
 *   3. lo que queda      → las aperturas del armazón, o sea los lentes
 *
 * Medido sobre las 34 fotos del catálogo: acierta las 5 de Crystal (2 lentes en
 * cada una, incluidas la de 3/4, la trasera y la de perfil plegado) y descarta
 * las 29 restantes, que llevan lente oscuro.
 *
 * LAS COMPROBACIONES NO SON PARANOIA. Una máscara mala no falla: pinta. Teñiría
 * una franja del armazón o medio fondo, y saldría a producción con aspecto de
 * foto real. Por eso una foto solo pasa si cumple las cuatro (ver `validate`),
 * y la última es la que de verdad decide: **dentro de la máscara la foto tiene
 * que ser CLARA**. Teñir es `multiply` y solo sabe oscurecer, así que de un
 * lente oscuro no sale ningún color — comprobar el brillo es comprobar que el
 * lente es transparente, que es la única condición real del método.
 *
 * `--debug <carpeta>` escribe la máscara y una previsualización teñida de cada
 * foto aceptada, para revisarlas antes de tocar la base.
 *
 * `--files <carpeta>` corre las MISMAS comprobaciones sobre archivos locales y
 * no abre la base ni escribe nada. Es la forma de saber si una foto sirve
 * ANTES de subirla: si aquí sale rechazada, en la tienda no se va a poder
 * teñir, y eso se arregla en el estudio —no en el código.
 */

const DRY = process.argv.includes('--dry')
const CLEAR = process.argv.includes('--clear')
const ONLY = argValue('--only')
const DEBUG_DIR = argValue('--debug')
const FILES_DIR = argValue('--files')

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag)
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null
}

/**
 * Tamaño de la máscara que se guarda. 160px es deliberado: la silueta es una
 * mancha de bordes suaves, y a 160 no se distingue de 320 sobre una foto de
 * 1000px (comprobado en el navegador) pero pesa la mitad — ~1,2 KB en base64,
 * que es lo que acaba viajando dentro del DTO en cada carga de la ficha.
 */
const MASK_PX = 160

/** Umbrales de aceptación, en fracción del área de la foto. */
const MIN_TOTAL_AREA = 0.02
const MAX_PIECE_AREA = 0.1
const MIN_PIECE_AREA = 0.005
/** Brillo medio mínimo dentro de la máscara (0..1). Debajo, el lente no es transparente. */
const MIN_BRIGHTNESS = 0.6

type Piece = { area: number }

function magick(args: string[]): string {
  return execFileSync('magick', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
}

/**
 * Aperturas del armazón: umbral, apagar lo conectado con las esquinas, etiquetar.
 *
 * Descarta con el MISMO `area-threshold` que `buildMask`, y eso no es una
 * coincidencia estética: contar con un umbral más bajo del que luego conserva la
 * máscara hacía que las manchas que `buildMask` iba a tirar igualmente contaran
 * como regiones y tumbaran la validación. Las dos frontales de Crystal —las que
 * más importan— se rechazaban por los dos huecos de 4.000 px que quedan entre la
 * patilla y el aro.
 */
function findPieces(src: string, work: string, w: number, h: number): Piece[] {
  const bw = path.join(work, 'bw.png')
  const holes = path.join(work, 'holes.png')
  magick([src, '-colorspace', 'gray', '-auto-threshold', 'OTSU', '-type', 'bilevel', bw])
  magick([
    bw,
    '-fuzz',
    '5%',
    '-fill',
    'black',
    '-draw',
    'color 0,0 floodfill',
    '-draw',
    `color ${w - 1},0 floodfill`,
    '-draw',
    `color 0,${h - 1} floodfill`,
    '-draw',
    `color ${w - 1},${h - 1} floodfill`,
    holes,
  ])
  const out = magick([
    holes,
    '-define',
    'connected-components:verbose=true',
    '-define',
    `connected-components:area-threshold=${Math.round(w * h * MIN_PIECE_AREA)}`,
    '-connected-components',
    '8',
    'null:',
  ])
  return out
    .split('\n')
    .filter((l) => l.includes('gray(255)'))
    .map((l) => ({ area: Number(l.trim().split(/\s+/)[3]) }))
    .filter((p) => Number.isFinite(p.area))
}

/**
 * Por qué esta foto no sirve, o `null` si sirve. Cuatro condiciones, y ninguna
 * sobra: las tres primeras descartan flatlays y fotos de gente (donde el
 * relleno encuentra huecos entre objetos), y la cuarta descarta el lente
 * oscuro, que es el caso que de verdad importa.
 */
function validate(pieces: Piece[], total: number, brightness: number): string | null {
  if (pieces.length === 0) return 'sin aperturas (lente oscuro o armazón sin contorno cerrado)'
  if (pieces.length > 2) return `${pieces.length} regiones: no es un par de lentes`
  const area = pieces.reduce((n, p) => n + p.area, 0)
  if (area / total < MIN_TOTAL_AREA) return `área ${(100 * area) / total}% demasiado pequeña`
  const biggest = Math.max(...pieces.map((p) => p.area))
  if (biggest / total > MAX_PIECE_AREA) return `región de ${(100 * biggest) / total}%: demasiado grande`
  if (brightness < MIN_BRIGHTNESS)
    return `brillo ${brightness.toFixed(2)} dentro de la máscara: el lente no es transparente`
  return null
}

/** Máscara limpia como `data:` URI de WebP alfa. */
function buildMask(work: string, w: number, h: number): { dataUri: string; bytes: number } {
  const holes = path.join(work, 'holes.png')
  const raw = path.join(work, 'raw.png')
  const alpha = path.join(work, 'mask.webp')
  magick([
    holes,
    '-define',
    `connected-components:area-threshold=${Math.round(w * h * MIN_PIECE_AREA)}`,
    '-define',
    'connected-components:mean-color=true',
    '-connected-components',
    '8',
    '-threshold',
    '50%',
    raw,
  ])
  // Erosionar y desenfocar: el umbral deja el borde justo sobre el filo del aro
  // y una línea de color se derramaba sobre él. Dentro, y difuminado, el tinte
  // muere antes de tocar el armazón.
  magick([
    raw,
    '-morphology',
    'erode',
    'octagon:2',
    '-blur',
    '0x1.5',
    '-alpha',
    'off',
    '-colorspace',
    'gray',
    path.join(work, 'gray.png'),
  ])
  magick([
    '-size',
    `${w}x${h}`,
    'xc:white',
    path.join(work, 'gray.png'),
    '-alpha',
    'off',
    '-compose',
    'copy_opacity',
    '-composite',
    '-resize',
    `${MASK_PX}x${MASK_PX}`,
    '-quality',
    '82',
    alpha,
  ])
  const buf = readFileSync(alpha)
  return { dataUri: `data:image/webp;base64,${buf.toString('base64')}`, bytes: buf.length }
}

/** Brillo medio de la foto DENTRO de la máscara (0..1). */
function brightnessInMask(src: string, work: string): number {
  const masked = path.join(work, 'masked.png')
  magick([src, path.join(work, 'raw.png'), '-alpha', 'off', '-compose', 'copy_opacity', '-composite', masked])
  const mean = magick([masked, '-colorspace', 'gray', '-format', '%[fx:mean.r]', 'info:'])
  return Number(mean)
}

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif'])

type Analysis = { problem: string | null; dataUri: string; bytes: number; lenses: number; brightness: number }

/** Analiza una foto ya en disco. `work` es un directorio temporal propio. */
function analyze(src: string, work: string): Analysis {
  const [w, h] = magick([`${src}[0]`, '-format', '%w %h', 'info:']).split(' ').map(Number)
  const pieces = findPieces(src, work, w, h)
  // `buildMask` escribe `raw.png`, que es sobre lo que se mide el brillo. Se
  // construye siempre y se descarta si la validación no pasa: es barato y evita
  // repetir la etiquetada de componentes.
  const mask = buildMask(work, w, h)
  const brightness = pieces.length > 0 ? brightnessInMask(src, work) : 0
  return {
    problem: validate(pieces, w * h, brightness),
    dataUri: mask.dataUri,
    bytes: mask.bytes,
    lenses: pieces.length,
    brightness,
  }
}

/** Previsualización teñida de amarillo, para revisar la máscara a ojo. */
function writeDebug(src: string, work: string, dir: string, name: string) {
  execFileSync('mkdir', ['-p', dir])
  const [w, h] = magick([`${src}[0]`, '-format', '%w %h', 'info:']).split(' ').map(Number)
  magick([
    src, '(', '-clone', '0', '(', '-size', `${w}x${h}`, 'xc:#f0c23c', ')',
    '-compose', 'multiply', '-composite', ')',
    path.join(work, 'gray.png'), '-compose', 'over', '-composite',
    '-resize', '700x700', path.join(dir, `${name}.preview.jpg`),
  ])
}

/** Modo `--files`: comprueba fotos locales sin abrir la base. */
function checkLocalFiles(dir: string) {
  const root = path.resolve(dir)
  const files: string[] = []
  const walk = (d: string) => {
    for (const entry of readdirSync(d)) {
      const full = path.join(d, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (IMAGE_EXT.has(path.extname(entry).toLowerCase())) files.push(full)
    }
  }
  walk(root)
  let ok = 0
  for (const file of files.sort()) {
    const work = mkdtempSync(path.join(tmpdir(), 'axis-mask-'))
    try {
      const a = analyze(file, work)
      const rel = path.relative(root, file)
      if (a.problem) {
        console.log(`  ·  ${rel} — ${a.problem}`)
      } else {
        console.log(`  ✓  ${rel} — ${a.lenses} lente(s), brillo ${a.brightness.toFixed(2)}, máscara ${a.bytes} B`)
        if (DEBUG_DIR) writeDebug(file, work, path.resolve(DEBUG_DIR), rel.replace(/[\\/]/g, '_'))
        ok++
      }
    } catch (err) {
      console.log(`  !  ${path.relative(root, file)} — ${(err as Error).message}`)
    } finally {
      rmSync(work, { recursive: true, force: true })
    }
  }
  console.log(`\n${ok} de ${files.length} foto(s) se pueden teñir`)
}

async function main() {
  if (FILES_DIR) {
    checkLocalFiles(FILES_DIR)
    return
  }
  const ds = await buildDataSource().initialize()
  try {
    const products = await ds.getRepository(AxisProduct).find({ relations: { images: true } })
    const targets = ONLY ? products.filter((p) => p.slug === ONLY) : products
    if (ONLY && targets.length === 0) throw new Error(`No existe el producto "${ONLY}"`)

    if (CLEAR) {
      const ids = targets.flatMap((p) => (p.images ?? []).map((i) => i.id))
      if (!DRY && ids.length > 0) {
        await ds.getRepository(AxisProductImage).update(ids, { lensMask: null })
      }
      console.log(`Máscaras borradas: ${ids.length} foto(s)${DRY ? ' (dry)' : ''}`)
      return
    }

    let ok = 0
    let skipped = 0
    for (const product of targets) {
      const images = (product.images ?? []).slice().sort((a, b) => a.position - b.position)
      console.log(`\n${product.slug} — ${images.length} foto(s)`)
      for (const img of images) {
        const work = mkdtempSync(path.join(tmpdir(), 'axis-mask-'))
        try {
          const res = await fetch(cdnUrl(img.imageKey))
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const ext = path.extname(img.imageKey) || '.png'
          const src = path.join(work, `src${ext}`)
          writeFileSync(src, Buffer.from(await res.arrayBuffer()))

          const a = analyze(src, work)
          const name = path.basename(img.imageKey)
          if (a.problem) {
            console.log(`  ·  ${name} — ${a.problem}`)
            skipped++
            continue
          }
          console.log(
            `  ✓  ${name} — ${a.lenses} lente(s), brillo ${a.brightness.toFixed(2)}, máscara ${a.bytes} B`,
          )
          if (DEBUG_DIR) writeDebug(src, work, path.resolve(DEBUG_DIR, product.slug), name)
          if (!DRY) {
            await ds.getRepository(AxisProductImage).update(img.id, { lensMask: a.dataUri })
          }
          ok++
        } catch (err) {
          console.log(`  !  ${path.basename(img.imageKey)} — ${(err as Error).message}`)
          skipped++
        } finally {
          rmSync(work, { recursive: true, force: true })
        }
      }
    }
    console.log(`\n${ok} máscara(s) generada(s), ${skipped} foto(s) sin máscara${DRY ? ' (dry)' : ''}`)
  } finally {
    await ds.destroy()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
