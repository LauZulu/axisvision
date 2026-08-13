import { z } from 'zod'
import { setAppointmentStatus } from '../../../../src/server/appointments'
import { requireAdmin } from '../../../../src/server/guard'
import { json, jsonError } from '../../../../src/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Mover una cita de estado. Nada del sistema lo puede hacer solo —no hay evento
 * que sepa que alguien fue a la óptica—, así que este endpoint es la ÚNICA
 * forma de cerrar una cita. Sin él la cola crece para siempre.
 */
const schema = z.object({
  id: z.string().uuid(),
  status: z.enum(['pending', 'scheduled', 'done', 'cancelled']),
})

export async function POST(req: Request) {
  const gate = await requireAdmin()
  if (gate.response) return gate.response

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return jsonError('INVALID_BODY', 'Datos inválidos.', 400)

  try {
    const done = await setAppointmentStatus(parsed.data.id, parsed.data.status)
    if (!done) return jsonError('NOT_FOUND', 'Esa cita ya no existe.', 404)
    return json({ ok: true })
  } catch (err) {
    console.error('[admin/citas] no se pudo cambiar el estado:', err)
    return jsonError('DB_ERROR', 'No se pudo guardar el cambio.', 500)
  }
}
