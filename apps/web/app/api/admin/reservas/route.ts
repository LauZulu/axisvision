import { z } from 'zod'
import { listStockAlerts, markAlertNotified, notifyProductAvailable } from '../../../../src/server/waitlist'
import { requireAdmin } from '../../../../src/server/guard'
import { json, jsonError } from '../../../../src/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const gate = await requireAdmin()
  if (gate.response) return gate.response
  try {
    return json({ alerts: await listStockAlerts() })
  } catch (err) {
    console.error('[admin] GET /api/admin/reservas falló:', err)
    return jsonError('DB_ERROR', 'No se pudieron leer las reservas.', 500)
  }
}

const schema = z.union([
  z.object({ productId: z.string().uuid() }),
  z.object({ alertId: z.string().uuid() }),
])

/**
 * Dos acciones manuales del panel, según lo que llegue en el cuerpo.
 *
 * `productId` → **aviso masivo por correo**. El automático se dispara con la
 * transición de stock 0 → >0, pero hay un caso que esa transición no cubre y es
 * justo el de ahora: gente que se apuntó con la tienda cerrada, en modelos que
 * YA tienen stock. Cuando se abran los pagos no habrá ningún movimiento de
 * inventario que dispare nada — hay que poder decir "avísales ahora". Marca
 * como notificados a los que tenían correo, así que un segundo clic no reenvía.
 *
 * `alertId` → **marcar una reserva como avisada, sin mandar nada**. Es el cierre
 * del camino de quien no dejó correo: se le escribió por WhatsApp desde el panel
 * y hay que sacarlo de la lista de espera a mano.
 */
export async function POST(req: Request) {
  const gate = await requireAdmin()
  if (gate.response) return gate.response

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return jsonError('INVALID_BODY', 'Falta el producto o la reserva.', 400)

  if ('alertId' in parsed.data) {
    try {
      const ok = await markAlertNotified(parsed.data.alertId)
      if (!ok) return jsonError('NOT_FOUND', 'Esa reserva ya no existe.', 404)
      return json({ ok: true })
    } catch (err) {
      console.error('[reservas] no se pudo marcar como avisada:', err)
      return jsonError('DB_ERROR', 'No se pudo marcar la reserva.', 500)
    }
  }

  try {
    const { sent, pendingWhatsapp } = await notifyProductAvailable(parsed.data.productId)
    return json({ ok: true, sent, pendingWhatsapp })
  } catch (err) {
    console.error('[reservas] aviso manual fallido:', err)
    return jsonError('SEND_ERROR', 'No se pudieron enviar los avisos.', 500)
  }
}
