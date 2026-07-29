import { getAllLensOptions } from '../../../../src/server/lenses'
import { LensOptionsView } from '../../../../src/components/admin/LensOptionsView'
import { AdminDbError } from '../../../../src/components/admin/AdminDbError'

export const dynamic = 'force-dynamic'

export default async function AdminLensesPage() {
  try {
    return <LensOptionsView options={await getAllLensOptions()} />
  } catch {
    return <AdminDbError />
  }
}
