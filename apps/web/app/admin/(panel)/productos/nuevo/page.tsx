import { getActiveLensOptions } from '../../../../../src/server/lenses'
import { ProductForm } from '../../../../../src/components/admin/ProductForm'
import { AdminDbError } from '../../../../../src/components/admin/AdminDbError'

export const dynamic = 'force-dynamic'

export default async function NewProductPage() {
  let lensOptions
  try {
    lensOptions = await getActiveLensOptions()
  } catch (err) {
    console.error('[admin] producto nuevo:', err)
    return <AdminDbError />
  }
  return <ProductForm lensOptions={lensOptions} />
}
