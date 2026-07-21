// Helpers de CloudFront (puros, sin SDK → seguros en cliente y servidor).
// El bucket S3 es privado; el público lee SIEMPRE por CloudFront.
// NEXT_PUBLIC_CDN_URL es público (no secreto): p. ej. https://d1234.cloudfront.net

/** Base de CloudFront sin barra final. '' si no está configurado aún. */
export function cdnBase(): string {
  return (process.env.NEXT_PUBLIC_CDN_URL || '').replace(/\/+$/, '')
}

/** Una imagen es remota (S3/CloudFront) si ya es URL o tiene ruta (`products/...`). */
export function isRemoteImage(keyOrUrl: string): boolean {
  return /^https?:\/\//.test(keyOrUrl) || keyOrUrl.includes('/')
}

/** URL pública final (CloudFront) a partir de una clave S3. */
export function cdnUrl(key: string): string {
  if (/^https?:\/\//.test(key)) return key
  const base = cdnBase()
  return base ? `${base}/${key.replace(/^\/+/, '')}` : `/${key}`
}
