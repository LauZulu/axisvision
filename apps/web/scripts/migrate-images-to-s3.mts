import './_env'
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { Client } from 'pg'

// Sube las imágenes del SITIO (landing) a S3 con claves `site/...` y devuelve el
// manifiesto de dimensiones para `src/lib/siteImages.ts`.
//
//   pnpm exec tsx scripts/migrate-images-to-s3.mts <carpeta-con-originales>
//
// La carpeta se pasa por argumento: `src/assets/` ya no existe (las imágenes no
// viven en el repo). Dentro, la estructura es `<categoria>/<archivo>` — se
// convierte tal cual en `site/<categoria>/<archivo>`.
//
// OJO: esto es para la landing. Las fotos de PRODUCTO van por otro camino:
// `pnpm images:upload` (buzón `fotos-para-subir/`, claves `products/...`).
//
// Idempotente: re-subir sobreescribe el mismo objeto. El UPDATE de la DB es un
// resto de la migración original y hoy no toca ninguna fila (ya no hay claves
// locales); se conserva por si aparece una DB vieja.

const ASSETS_DIR = path.resolve(
  process.argv[2] ?? path.join(import.meta.dirname, '../../../fotos-sitio'),
)
const EXTS: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
}

// Clave local (DB de prueba) → ruta relativa dentro de src/assets.
const LOCAL_KEY_TO_FILE: Record<string, string> = {
  'gafas-de-frente': 'packaging/gafas-de-frente.jpeg',
  'empaque-abierto': 'packaging/empaque-abierto-con-gafas.jpeg',
  'hero-producto': 'hero/hero-producto.jpeg',
  'hero-producto-02': 'hero/hero-producto-02.jpeg',
  'modelo-01': 'lifestyle/modelo-01.jpg',
  'modelo-02': 'lifestyle/modelo-02.jpg',
  'modelo-03': 'lifestyle/modelo-03.jpg',
  'modelo-05': 'lifestyle/modelo-05.jpeg',
  'modelo-07': 'lifestyle/modelo-07.jpeg',
  'modelo-08': 'lifestyle/modelo-08.jpeg',
  cafe: 'retail/axis-en-cafe.jpg',
  'cafe-02': 'retail/axis-en-cafe-02.jpg',
}

function listImages(dir: string, base = ''): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    const rel = base ? `${base}/${name}` : name
    if (statSync(full).isDirectory()) out.push(...listImages(full, rel))
    else if (EXTS[path.extname(name).toLowerCase()]) out.push(rel)
  }
  return out
}

async function main() {
  const bucket = process.env.AWS_PRODUCTS_BUCKET
  if (!bucket) throw new Error('AWS_PRODUCTS_BUCKET no está definido')
  if (!existsSync(ASSETS_DIR)) {
    throw new Error(
      `No existe "${ASSETS_DIR}".\n` +
        `Pasa la carpeta con los originales de la landing:\n` +
        `  pnpm exec tsx scripts/migrate-images-to-s3.mts <carpeta>\n` +
        `(para fotos de PRODUCTO usa "pnpm images:upload")`,
    )
  }
  const s3 = new S3Client({ region: process.env.AWS_REGION })

  const files = listImages(ASSETS_DIR)
  console.log(`Subiendo ${files.length} imágenes al bucket "${bucket}"…`)

  const manifest: Record<string, { key: string; width: number; height: number }> = {}
  for (const rel of files) {
    const full = path.join(ASSETS_DIR, rel)
    const key = `site/${rel}`
    const [w, h] = execFileSync('identify', ['-format', '%w %h', `${full}[0]`], {
      encoding: 'utf8',
    })
      .trim()
      .split(' ')
      .map(Number)
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: readFileSync(full),
        ContentType: EXTS[path.extname(rel).toLowerCase()],
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    )
    manifest[rel] = { key, width: w, height: h }
    console.log(`  ✓ ${key} (${w}×${h})`)
  }

  // Re-apuntar claves locales de la DB a las claves S3.
  const db = new Client({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT) || 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    ssl: process.env.POSTGRES_SSL === 'false' ? undefined : { rejectUnauthorized: false },
  })
  await db.connect()
  let updated = 0
  for (const [localKey, relFile] of Object.entries(LOCAL_KEY_TO_FILE)) {
    const res = await db.query(
      `UPDATE axis_product_image SET "imageKey" = $1 WHERE "imageKey" = $2`,
      [`site/${relFile}`, localKey],
    )
    updated += res.rowCount ?? 0
  }
  const { rows } = await db.query(
    `SELECT count(*)::int AS n FROM axis_product_image WHERE "imageKey" NOT LIKE '%/%'`,
  )
  await db.end()
  console.log(`\nDB: ${updated} filas actualizadas; claves locales restantes: ${rows[0].n}`)
  console.log('\nManifiesto (para src/lib/siteImages.ts):')
  console.log(JSON.stringify(manifest, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
