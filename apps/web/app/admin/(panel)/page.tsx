import { getAdminStats, getLowStockProducts, LOW_STOCK_THRESHOLD } from '../../../src/server/admin'
import { getOrderStats, getRecentOrders } from '../../../src/server/orders'
import { DashboardView } from '../../../src/components/admin/DashboardView'
import { AdminDbError } from '../../../src/components/admin/AdminDbError'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  try {
    const [stats, orderStats, lowStock, recent] = await Promise.all([
      getAdminStats(),
      getOrderStats(),
      getLowStockProducts(),
      getRecentOrders(6),
    ])
    return (
      <DashboardView
        stats={stats}
        orderStats={orderStats}
        lowStock={lowStock}
        recent={recent}
        threshold={LOW_STOCK_THRESHOLD}
      />
    )
  } catch {
    return <AdminDbError />
  }
}
