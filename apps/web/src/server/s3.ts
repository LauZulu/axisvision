import { randomUUID } from 'node:crypto'
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Cliente S3 configurado por variables de entorno. El bucket es PRIVADO: el
// backend NUNCA sube ni sirve binarios; solo firma URLs para que el cliente del
// admin cargue directo (PUT) o borre (DELETE), y el público lee vía CloudFront.
let _client: S3Client | undefined

function s3(): S3Client {
  if (!_client) {
    const region = process.env.AWS_REGION
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error('Faltan variables AWS_REGION / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY')
    }
    _client = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } })
  }
  return _client
}

function bucket(): string {
  const b = process.env.AWS_PRODUCTS_BUCKET
  if (!b) throw new Error('AWS_PRODUCTS_BUCKET no está definido')
  return b
}

// Las presigned URLs viven poco: solo el tiempo de una carga/borrado.
const PRESIGN_TTL = 300 // 5 minutos

/** Presigned PUT: el admin sube el archivo directo a S3 (sin pasar por el backend). */
export function presignUpload(key: string, contentType: string): Promise<string> {
  const cmd = new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType })
  return getSignedUrl(s3(), cmd, { expiresIn: PRESIGN_TTL })
}

/** Presigned DELETE: el admin borra un objeto directo en S3. */
export function presignDelete(key: string): Promise<string> {
  const cmd = new DeleteObjectCommand({ Bucket: bucket(), Key: key })
  return getSignedUrl(s3(), cmd, { expiresIn: PRESIGN_TTL })
}

/**
 * Borra objetos del bucket desde el servidor (limpieza al eliminar un producto).
 * Best-effort y SOLO dentro de `products/`: las claves `site/...` son las fotos
 * del sitio (compartidas con la landing y el seed) y nunca se limpian desde aquí.
 */
export async function deleteObjects(keys: string[]): Promise<void> {
  const remote = keys.filter((k) => k && k.startsWith('products/'))
  await Promise.allSettled(
    remote.map((Key) => s3().send(new DeleteObjectCommand({ Bucket: bucket(), Key }))),
  )
}

/** Verifica acceso al bucket (lista 1 objeto). No sube nada. */
export async function checkS3Access(): Promise<{ bucket: string; region: string }> {
  await s3().send(new ListObjectsV2Command({ Bucket: bucket(), MaxKeys: 1 }))
  return { bucket: bucket(), region: process.env.AWS_REGION! }
}

/** Genera una clave S3 única para una foto de producto: `products/<uuid>.<ext>`. */
export function buildProductImageKey(filename: string): string {
  const clean = (filename || '').toLowerCase()
  const ext = clean.includes('.') ? clean.split('.').pop()!.replace(/[^a-z0-9]/g, '') : 'jpg'
  return `products/${randomUUID()}.${ext || 'jpg'}`
}

// Los helpers de URL pública (cdnUrl / isRemoteImage / cdnBase) viven en ../lib/cdn
// (puros, sin SDK) para no arrastrar el AWS SDK al render del catálogo.
