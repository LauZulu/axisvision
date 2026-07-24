import { getAllOrders } from '../../../../src/server/orders'
import { OrdersView } from '../../../../src/components/admin/OrdersView'
import { AdminDbError } from '../../../../src/components/admin/AdminDbError'

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage() {
  try {
    const orders = await getAllOrders()
    return <OrdersView orders={orders} />
  } catch {
    return <AdminDbError />
  }
}
