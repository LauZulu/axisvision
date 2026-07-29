import { updateLensOption, deleteLensOption } from '../../../../../src/server/lenses'
import { lensOptionPatchSchema } from '../../../../../src/server/validation'
import { requireAdmin } from '../../../../../src/server/guard'
import { json, jsonError } from '../../../../../src/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin()
  if (gate.response) return gate.response

  const { id } = await params
  const parsed = lensOptionPatchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return jsonError('INVALID_BODY', 'Datos de la opción de lente inválidos.', 400)
  }
  try {
    const ok = await updateLensOption(id, parsed.data)
    return ok ? json({ ok: true }) : jsonError('NOT_FOUND', 'Opción no encontrada.', 404)
  } catch {
    return jsonError('DB_ERROR', 'No se pudo guardar la opción.', 500)
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin()
  if (gate.response) return gate.response

  const { id } = await params
  try {
    const ok = await deleteLensOption(id)
    return ok ? json({ ok: true }) : jsonError('NOT_FOUND', 'Opción no encontrada.', 404)
  } catch {
    return jsonError('DB_ERROR', 'No se pudo eliminar la opción.', 500)
  }
}
