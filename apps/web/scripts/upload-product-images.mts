import './_env'
import 'reflect-metadata'
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import type { DataSource } from 'typeorm'
import { buildDataSource } from '../src/server/db/data-source'
import { AxisProduct } from '../src/server/db/entities/Product'
import { AxisProductImage } from '../src/server/db/entities/ProductImage'
import type { ImageLensVariant } from '../src/server/db/entities/ProductImage'

/**
 * Sube las fotos reales de cada modelo a S3 y las conecta con la tienda.
 *
 *   pnpm images:upload [--dry] [--keep-samples]
 *
 * Estructura del buzón local (`fotos-para-subir/`), una carpeta por modelo y
 * dentro una por VARIANTE de lente — un mismo modelo se fotografía con lentes
 * distintos y la ficha muestra los que correspondan al que el cliente eligió:
 *
 *   fotos-para-subir/axis-origin/sunglass/*.jpg     → lente de sol
 *   fotos-para-subir/axis-origin/oftalmica/*.jpg    → lente transparente
 *   fotos-para-subir/axis-apex/amarillo/*.jpg       → filtro amarillo
 *   fotos-para-subir/axis-origin/*.jpg              → sin variante (sirve para todas)
 *
 * Cada foto acaba en `products/<slug>/<variante>/<categoria>-NN.<ext>`, y su
 * variante queda en `axis_product_image.lensVariant`.
 *
 * CLASIFICACIÓN. El orden y la categoría salen de un `orden.json` por carpeta,
 * escrito DESPUÉS de revisar las fotos una a una:
 *
 *   [{ "file": "PXL_1234.jpg", "category": "frente" }, …]
 *
 * El primero de la primera variante es la portada. Sin manifiesto se usa el
 * orden alfabético y la categoría se adivina del nombre del archivo.
 *
 * Al terminar borra del bucket las fotos de ejemplo (`ejemplo-*`) que quedan
 * huérfanas, salvo `--keep-samples`. Idempotente: re-subir sobrescribe.
 */

const DRY = process.argv.includes('--dry')
const KEEP_SAMPLES = process.argv.includes('--keep-samples')

const INBOX = path.resolve(import.meta.dirname, '../../../fotos-para-subir')

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
}

/** Carpeta de variante → valor guardado en la DB. */
const VARIANTS: Record<string, ImageLensVariant> = {
  sunglass: 'sunglass',
  sol: 'sunglass',
  oftalmica: 'ophthalmic',
  oftalmicas: 'ophthalmic',
  ophthalmic: 'ophthalmic',
  transparente: 'ophthalmic',
  amarillo: 'yellow',
  yellow: 'yellow',
}

/** Orden de las variantes en la galería: primero la de fábrica (sol). */
const VARIANT_ORDER: (ImageLensVariant | null)[] = ['sunglass', 'ophthalmic', 'yellow', null]

/** Categorías, en el orden en que se muestran dentro de cada variante. */
const CATEGORY_ORDER = ['frente', 'angulo', 'detalle', 'estuche', 'puesta', 'otro'] as const
type Category = (typeof CATEGORY_ORDER)[number]

const HINTS: [RegExp, Category][] = [
  [/frente|front|frontal/i, 'frente'],
  [/angulo|ángulo|angle|lateral|side|perfil|3-?4/i, 'angulo'],
  [/detalle|detail|macro|patilla|bisagra|grabado|logo|lente/i, 'detalle'],
  [/estuche|forro|case|empaque|packaging|caja|funda/i, 'estuche'],
  [/puesta|puesto|modelo|model|lifestyle|persona/i, 'puesta'],
]

const guessCategory = (file: string): Category =>
  HINTS.find(([re]) => re.test(file))?.[1] ?? 'otro'

type Entry = { file: string; category: Category }

/** Fotos de una carpeta, ordenadas: manifiesto si existe, alfabético si no. */
function readFolder(dir: string, label: string): Entry[] {
  const files = readdirSync(dir)
    .filter((f) => CONTENT_TYPES[path.extname(f).toLowerCase()])
    .filter((f) => statSync(path.join(dir, f)).isFile())

  const manifestPath = path.join(dir, 'orden.json')
  if (!existsSync(manifestPath)) {
    return files.sort().map((file) => ({ file, category: guessCategory(file) }))
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Entry[]
  const known = new Set(files)
  for (const entry of manifest) {
    if (!known.has(entry.file)) throw new Error(`${label}/orden.json: no existe "${entry.file}"`)
    if (!CATEGORY_ORDER.includes(entry.category)) {
      throw new Error(`${label}/orden.json: categoría desconocida "${entry.category}"`)
    }
  }
  const listed = new Set(manifest.map((e) => e.file))
  const rest = files
    .filter((f) => !listed.has(f))
    .sort()
    .map((file) => ({ file, category: guessCategory(file) }))
  if (rest.length) console.warn(`  ! ${label}: ${rest.length} fotos fuera del manifiesto, van al final`)
  return [...manifest, ...rest]
}

type PlannedImage = {
  source: string
  key: string
  variant: ImageLensVariant | null
}

/** Recorre `<slug>/[<variante>/]` y calcula el nombre final de cada foto. */
function planProduct(slug: string): PlannedImage[] {
  const root = path.join(INBOX, slug)
  const planned: PlannedImage[] = []

  const groups: { variant: ImageLensVariant | null; dir: string; label: string }[] = []

  // Fotos sueltas en la raíz del modelo: sin variante.
  if (readdirSync(root).some((f) => CONTENT_TYPES[path.extname(f).toLowerCase()])) {
    groups.push({ variant: null, dir: root, label: slug })
  }
  for (const name of readdirSync(root)) {
    const dir = path.join(root, name)
    if (!statSync(dir).isDirectory()) continue
    const variant = VARIANTS[name.toLowerCase()]
    if (!variant) {
      throw new Error(
        `${slug}/${name}: carpeta de variante desconocida. Válidas: ${Object.keys(VARIANTS).join(', ')}`,
      )
    }
    groups.push({ variant, dir, label: `${slug}/${name}` })
  }

  // Orden estable: sol primero, luego oftálmica, amarillo y las sin variante.
  groups.sort(
    (a, b) => VARIANT_ORDER.indexOf(a.variant) - VARIANT_ORDER.indexOf(b.variant),
  )

  for (const group of groups) {
    const entries = readFolder(group.dir, group.label)
    const counters = new Map<Category, number>()
    const folder = group.variant ? `${group.variant}/` : ''
    for (const entry of entries) {
      const n = (counters.get(entry.category) ?? 0) + 1
      counters.set(entry.category, n)
      const ext = path.extname(entry.file).toLowerCase()
      planned.push({
        source: path.join(group.dir, entry.file),
        key: `products/${slug}/${folder}${entry.category}-${String(n).padStart(2, '0')}${ext}`,
        variant: group.variant,
      })
    }
  }
  return planned
}

const bucket = process.env.AWS_PRODUCTS_BUCKET
if (!bucket) throw new Error('AWS_PRODUCTS_BUCKET no está definido')

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

let db: DataSource

async function main() {
  if (!existsSync(INBOX)) throw new Error(`No existe la carpeta ${INBOX}`)

  const slugs = readdirSync(INBOX)
    .filter((name) => statSync(path.join(INBOX, name)).isDirectory())
    .sort()

  const plan = new Map<string, PlannedImage[]>()
  for (const slug of slugs) {
    const images = planProduct(slug)
    if (images.length) plan.set(slug, images)
  }

  if (plan.size === 0) {
    console.log(`No hay fotos en ${INBOX}.`)
    return
  }

  for (const [slug, images] of plan) {
    console.log(`\n${slug} — ${images.length} fotos`)
    for (const img of images) {
      console.log(`  ${path.basename(img.source).padEnd(28)} → ${img.key}`)
    }
  }

  if (DRY) {
    console.log('\n--dry: no se sube ni se escribe nada.')
    return
  }

  db = buildDataSource()
  await db.initialize()

  for (const [slug, images] of plan) {
    const product = await db.getRepository(AxisProduct).findOne({ where: { slug } })
    if (!product) {
      console.warn(`\n! no existe el producto "${slug}" — saltado`)
      continue
    }

    for (const img of images) {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: img.key,
          Body: readFileSync(img.source),
          ContentType: CONTENT_TYPES[path.extname(img.source).toLowerCase()],
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      )
    }

    const previous = await db
      .getRepository(AxisProductImage)
      .find({ where: { productId: product.id } })
    const newKeys = images.map((i) => i.key)

    await db.transaction(async (m) => {
      await m.delete(AxisProductImage, { productId: product.id })
      await m.save(
        images.map((img, position) =>
          m.create(AxisProductImage, {
            productId: product.id,
            imageKey: img.key,
            position,
            lensVariant: img.variant,
          }),
        ),
      )
    })

    // Limpia las fotos de ejemplo que ya nadie referencia. Solo toca
    // `products/<slug>/ejemplo-*`: nunca las claves `site/...` de la landing.
    if (!KEEP_SAMPLES) {
      const orphans = previous
        .map((i) => i.imageKey)
        .filter((k) => k.startsWith(`products/${slug}/ejemplo-`) && !newKeys.includes(k))
      for (const Key of orphans) await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key }))
      if (orphans.length) console.log(`${slug}: ${orphans.length} fotos de ejemplo eliminadas`)
    }

    const byVariant = new Map<string, number>()
    for (const img of images) {
      const k = img.variant ?? 'sin variante'
      byVariant.set(k, (byVariant.get(k) ?? 0) + 1)
    }
    const summary = [...byVariant].map(([v, n]) => `${v} ${n}`).join(', ')
    console.log(`${slug}: ${newKeys.length} fotos publicadas (${summary})`)
  }

  console.log('\nListo. La tienda ya sirve estas fotos por CloudFront.')
}

main()
  .catch((err) => {
    console.error('\nFalló la subida:', err instanceof Error ? err.message : err)
    process.exitCode = 1
  })
  .finally(async () => {
    if (db?.isInitialized) await db.destroy()
  })
