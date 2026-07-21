import { getAllOrders } from '../../../../src/server/orders'
import { OrderTable } from '../../../../src/components/admin/OrderTable'

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage() {
  let orders
  try {
    orders = await getAllOrders()
  } catch {
    return (
      <div className="rounded-2xl border border-line bg-carbon-850 p-8">
        <h1 className="font-head text-xl text-warm-white">Base de datos no disponible</h1>
        <p className="mt-2 text-warm-gray/70">No se pudieron cargar los pedidos. Revisa la conexión.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-head text-2xl text-warm-white">Pedidos</h1>
      <p className="mt-1 text-warm-gray/60">Ventas y su estado. Cambia el estado a medida que avanzas.</p>
      <div className="mt-8">
        <OrderTable orders={orders} />
      </div>
    </div>
  )
}
