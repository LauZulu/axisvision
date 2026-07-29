import './_env'
import 'reflect-metadata'
import { S3Client, CopyObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import type { DataSource } from 'typeorm'
import { buildDataSource } from '../src/server/db/data-source'
import { AxisProduct } from '../src/server/db/entities/Product'
import { AxisProductImage } from '../src/server/db/entities/ProductImage'

/**
 * Fotos de EJEMPLO por modelo, mientras llegan las definitivas.
 *
 *   pnpm images:sample [--dry]
 *
 * Copia dentro del bucket (S3 → S3, sin descargar) fotos del sitio a la carpeta
 * de cada producto siguiendo la arquitectura del repo:
 *
 *   products/<slug>/ejemplo-NN.<ext>
 *
 * Por qué copiarlas en vez de apuntar a `site/...`: las claves `site/` están
 * PROTEGIDAS contra borrado (las usa la landing), así que el admin no podría
 * eliminarlas desde el panel. En `products/<slug>/` sí puede — que es justo lo
 * que hará cuando lleguen las fotos reales de cada modelo.
 *
 * El prefijo `ejemplo-` las hace evidentes en el bucket. Reejecutable: sobrescribe
 * las mismas claves y no duplica filas.
 */

const DRY = process.argv.includes('--dry')

/** Foto del sitio → producto. Sin repetir ninguna: variedad por modelo. */
const SAMPLES: Record<string, string[]> = {
  'axis-origin': [
    'site/hero/hero-producto.jpeg',
    'site/lifestyle/modelo-01.jpg',
    'site/packaging/gafas-de-frente.jpeg',
  ],
  'axis-apex': [
    'site/hero/hero-producto-02.jpeg',
    'site/lifestyle/modelo-04.jpg',
    'site/retail/axis-en-cafe.jpg',
  ],
  'axis-crystal': [
    'site/lifestyle/modelo-02.jpg',
    'site/lifestyle/modelo-08.jpeg',
    'site/retail/axis-en-cafe-02.jpg',
  ],
  'axis-shadow': [
    'site/lifestyle/modelo-05.jpeg',
    'site/lifestyle/modelo-07.jpeg',
    'site/packaging/empaque-abierto-con-gafas.jpeg',
  ],
  'axis-ocean': ['site/lifestyle/modelo-03.jpg', 'site/lifestyle/modelo-06.jpg'],
  'axis-eclypse': ['site/lifestyle/modelo-06.jpeg', 'site/packaging/empaque-cerrado.jpeg'],
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

const extOf = (key: string) => key.split('.').pop()!.toLowerCase()

let db: DataSource

async function main() {
  // 1) Verificar que las fuentes existen antes de tocar nada.
  const sources = [...new Set(Object.values(SAMPLES).flat())]
  for (const key of sources) {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
  }
  console.log(`Fuentes verificadas: ${sources.length} objetos en site/`)

  if (DRY) {
    console.log('\n--dry: no se copia ni se escribe nada.\n')
    for (const [slug, keys] of Object.entries(SAMPLES)) {
      keys.forEach((src, i) =>
        console.log(`  ${src}\n    → products/${slug}/ejemplo-${String(i + 1).padStart(2, '0')}.${extOf(src)}`),
      )
    }
    return
  }

  db = buildDataSource()
  await db.initialize()

  for (const [slug, keys] of Object.entries(SAMPLES)) {
    const product = await db.getRepository(AxisProduct).findOne({ where: { slug } })
    if (!product) {
      console.warn(`  ! no existe el producto "${slug}" — saltado`)
      continue
    }

    const newKeys: string[] = []
    for (const [i, src] of keys.entries()) {
      const dest = `products/${slug}/ejemplo-${String(i + 1).padStart(2, '0')}.${extOf(src)}`
      await s3.send(
        new CopyObjectCommand({
          Bucket: bucket,
          // CopySource va URL-encoded e incluye el bucket.
          CopySource: encodeURI(`${bucket}/${src}`),
          Key: dest,
          MetadataDirective: 'COPY',
        }),
      )
      newKeys.push(dest)
    }

    // Reemplaza las fotos del producto por las recién copiadas.
    await db.transaction(async (m) => {
      await m.delete(AxisProductImage, { productId: product.id })
      await m.save(
        newKeys.map((imageKey, position) =>
          m.create(AxisProductImage, { productId: product.id, imageKey, position }),
        ),
      )
    })
    console.log(`  · ${slug}: ${newKeys.length} fotos → products/${slug}/`)
  }

  console.log('\nListo. Son fotos de EJEMPLO: bórralas desde el admin cuando subas las reales.')
}

main()
  .catch((err) => {
    console.error('\nFalló la copia:', err instanceof Error ? err.message : err)
    process.exitCode = 1
  })
  .finally(async () => {
    if (db?.isInitialized) await db.destroy()
  })
