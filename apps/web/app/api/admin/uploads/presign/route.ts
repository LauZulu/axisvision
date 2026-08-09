import { z } from 'zod'
import { requireAdmin } from '../../../../../src/server/guard'
import {
  presignUpload,
  presignDelete,
  buildProductImageKey,
} from '../../../../../src/server/s3'
import { cdnUrl } from '../../../../../src/lib/cdn'
import { json, jsonError } from '../../../../../src/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// PUT: subir una imagen nueva. DELETE: borrar una existente por su clave.
const schema = z.discriminatedUnion('operation', [
  z.object({
    operation: z.literal('put'),
    filename: z.string().min(1).max(200),
    contentType: z.string().regex(/^image\/(jpe?g|png|webp|avif)$/, 'Solo imágenes (jpg/png/webp/avif)'),
    // Slug del producto: agrupa la foto en `products/<slug>/` dentro del bucket.
    slug: z.string().max(120).optional(),
  }),
  z.object({
    operation: z.literal('delete'),
    // Solo se firman borrados dentro de `products/`: las claves `site/...`
    // (fotos del sitio/landing) no se tocan desde el admin.
    key: z.string().min(1).max(512).startsWith('products/'),
  }),
])

export async function POST(req: Request) {
  const gate = await requireAdmin()
  if (gate.response) return gate.response

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return jsonError('INVALID_BODY', 'Petición de firma inválida.', 400)
  }

  try {
    if (parsed.data.operation === 'put') {
      const key = buildProductImageKey(parsed.data.filename, parsed.data.slug)
      const url = await presignUpload(key, parsed.data.contentType)
      // El cliente sube con PUT a `url`; luego guarda `key` en el producto.
      // `publicUrl` es la ruta final de CloudFront (para previsualizar).
      return json({ key, url, publicUrl: cdnUrl(key), expiresIn: 300 })
    }
    const url = await presignDelete(parsed.data.key)
    return json({ key: parsed.data.key, url, expiresIn: 300 })
  } catch (err) {
    console.error('[admin] POST /api/admin/uploads/presign falló:', err)
    return jsonError('S3_ERROR', 'No se pudo firmar la URL de S3.', 500)
  }
}
