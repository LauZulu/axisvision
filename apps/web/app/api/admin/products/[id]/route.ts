import { updateProduct, softDeleteProduct } from '../../../../../src/server/admin'
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
  } catch {
    return jsonError('DB_ERROR', 'No se pudo actualizar el producto.', 500)
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin()
  if (gate.response) return gate.response

  const { id } = await params
  try {
    const ok = await softDeleteProduct(id)
    if (!ok) return jsonError('NOT_FOUND', 'Producto no encontrado.', 404)
    return json({ ok: true })
  } catch {
    return jsonError('DB_ERROR', 'No se pudo dar de baja el producto.', 500)
  }
}
