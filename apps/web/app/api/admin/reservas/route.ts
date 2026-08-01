import { z } from 'zod'
import { listStockAlerts, notifyProductAvailable } from '../../../../src/server/waitlist'
import { requireAdmin } from '../../../../src/server/guard'
import { json, jsonError } from '../../../../src/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const gate = await requireAdmin()
  if (gate.response) return gate.response
  try {
    return json({ alerts: await listStockAlerts() })
  } catch {
    return jsonError('DB_ERROR', 'No se pudieron leer las reservas.', 500)
  }
}

const schema = z.object({ productId: z.string().uuid() })

/**
 * Aviso manual de disponibilidad.
 *
 * El aviso automático se dispara con la transición de stock 0 → >0, pero hay un
 * caso que esa transición no cubre y es justo el de ahora: gente que se apuntó
 * con la tienda cerrada, en modelos que YA tienen stock. Cuando se abran los
 * pagos no habrá ningún movimiento de inventario que dispare nada — hay que
 * poder decir "avísales ahora".
 *
 * Marca a todos como notificados, así que un segundo clic no reenvía.
 */
export async function POST(req: Request) {
  const gate = await requireAdmin()
  if (gate.response) return gate.response

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return jsonError('INVALID_BODY', 'Falta el producto.', 400)

  try {
    const sent = await notifyProductAvailable(parsed.data.productId)
    return json({ ok: true, sent })
  } catch (err) {
    console.error('[reservas] aviso manual fallido:', err)
    return jsonError('SEND_ERROR', 'No se pudieron enviar los avisos.', 500)
  }
}
