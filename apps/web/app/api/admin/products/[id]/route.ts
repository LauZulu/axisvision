import {
  updateProduct,
  softDeleteProduct,
  hardDeleteProduct,
} from '../../../../../src/server/admin'
import { deleteObjects } from '../../../../../src/server/s3'
import { productPatchSchema } from '../../../../../src/server/validation'
import { requireAdmin } from '../../../../../src/server/guard'
import { json, jsonError } from '../../../../../src/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin()
  if (gate.response) return gate.response

  const { id } = await params
  const parsed = productPatchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return jsonError('INVALID_BODY', 'Datos de producto inválidos.', 400)
  }
  try {
    const ok = await updateProduct(id, parsed.data)
    if (!ok) return jsonError('NOT_FOUND', 'Producto no encontrado.', 404)
    return json({ ok: true })
  } catch (err) {
    console.error('[admin] PATCH /api/admin/products/%s falló:', id, err)
    return jsonError('DB_ERROR', 'No se pudo actualizar el producto.', 500)
  }
}

// ?mode=hard → borrado definitivo (+ limpieza de fotos en S3). Por defecto: baja (ocultar).
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin()
  if (gate.response) return gate.response

  const { id } = await params
  const hard = new URL(req.url).searchParams.get('mode') === 'hard'
  try {
    if (hard) {
      const { deleted, imageKeys } = await hardDeleteProduct(id)
      if (!deleted) return jsonError('NOT_FOUND', 'Producto no encontrado.', 404)
      await deleteObjects(imageKeys)
      return json({ ok: true, deleted: 'hard' })
    }
    const ok = await softDeleteProduct(id)
    if (!ok) return jsonError('NOT_FOUND', 'Producto no encontrado.', 404)
    return json({ ok: true, deleted: 'soft' })
  } catch (err) {
    console.error('[admin] DELETE /api/admin/products/%s falló:', id, err)
    return jsonError('DB_ERROR', 'No se pudo eliminar el producto.', 500)
  }
}
