import { updateProductUnit } from '../../../../../src/server/inventory'
import { productUnitPatchSchema } from '../../../../../src/server/validation'
import { requireAdmin } from '../../../../../src/server/guard'
import { json, jsonError } from '../../../../../src/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin()
  if (gate.response) return gate.response

  const { id } = await params
  const parsed = productUnitPatchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return jsonError('INVALID_BODY', 'Datos de la unidad inválidos.', 400)
  }
  try {
    const ok = await updateProductUnit(id, parsed.data)
    return ok ? json({ ok: true }) : jsonError('NOT_FOUND', 'Unidad no encontrada.', 404)
  } catch (err) {
    console.error('[admin] PATCH /api/admin/units/%s falló:', id, err)
    return jsonError('DB_ERROR', 'No se pudo guardar la unidad.', 500)
  }
}
