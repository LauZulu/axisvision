import './_env'
import { checkS3Access } from '../src/server/s3'

// Verifica que las credenciales tienen acceso al bucket (lista 1 objeto). No sube nada.
async function main() {
  const r = await checkS3Access()
  console.log(`✓ Acceso a S3 OK — bucket "${r.bucket}" en ${r.region}`)
  console.log(`  CloudFront (NEXT_PUBLIC_CDN_URL): ${process.env.NEXT_PUBLIC_CDN_URL || '(NO definido — falta)'}`)
}

main().catch((e) => {
  console.error('✗ S3 sin acceso:', e instanceof Error ? e.message : e)
  process.exit(1)
})
