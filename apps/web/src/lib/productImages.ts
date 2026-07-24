import { cdnUrl } from './cdn'

// Resolución de imágenes de producto: la DB guarda en `imageKey` una clave S3
// (`products/...` para fotos subidas por el admin, `site/...` para las migradas
// del repo) y el público las lee SIEMPRE por CloudFront. Ya no existen assets
// locales: todo se sirve desde el CDN.

/**
 * Fuente para next/image: usa la URL pública ya resuelta por el server si viene,
 * o la construye desde la clave S3 (útil en cliente, p. ej. el carrito).
 */
export function resolveProductSrc(image: { key: string; url: string | null }): string {
  return image.url ?? cdnUrl(image.key)
}
