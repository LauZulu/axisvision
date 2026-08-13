import { listAppointments } from '../../../../src/server/appointments'
import { AppointmentsView } from '../../../../src/components/admin/AppointmentsView'
import { AdminDbError } from '../../../../src/components/admin/AdminDbError'

export const dynamic = 'force-dynamic'

export default async function AdminAppointmentsPage() {
  try {
    return <AppointmentsView rows={await listAppointments()} />
  } catch (err) {
    console.error('[admin] citas:', err)
    return <AdminDbError />
  }
}
