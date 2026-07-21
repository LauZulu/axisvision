import { getAllOrders } from '../../../../src/server/orders'
import { requireAdmin } from '../../../../src/server/guard'
import { json, jsonError } from '../../../../src/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const gate = await requireAdmin()
  if (gate.response) return gate.response
  try {
    return json({ orders: await getAllOrders() })
  } catch {
    return jsonError('DB_UNAVAILABLE', 'No se pudieron cargar los pedidos.', 503)
  }
}
