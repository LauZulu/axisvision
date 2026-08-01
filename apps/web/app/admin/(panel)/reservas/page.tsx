import { listStockAlerts } from '../../../../src/server/waitlist'
import { WaitlistView } from '../../../../src/components/admin/WaitlistView'
import { AdminDbError } from '../../../../src/components/admin/AdminDbError'

export const dynamic = 'force-dynamic'

export default async function AdminWaitlistPage() {
  try {
    const alerts = await listStockAlerts()
    return <WaitlistView alerts={alerts} />
  } catch {
    return <AdminDbError />
  }
}
