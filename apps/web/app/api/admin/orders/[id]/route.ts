import { z } from 'zod'
import { updateOrderStatus } from '../../../../../src/server/orders'
import { requireAdmin } from '../../../../../src/server/guard'
import { json, jsonError } from '../../../../../src/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({
  status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'failed']),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin()
  if (gate.response) return gate.response

  const { id } = await params
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return jsonError('INVALID_BODY', 'Estado inválido.', 400)
  }
  try {
    const ok = await updateOrderStatus(id, parsed.data.status)
    if (!ok) return jsonError('NOT_FOUND', 'Pedido no encontrado.', 404)
    return json({ ok: true })
  } catch (err) {
    console.error('[admin] PATCH /api/admin/orders/%s falló:', id, err)
    return jsonError('DB_ERROR', 'No se pudo actualizar el pedido.', 500)
  }
}
