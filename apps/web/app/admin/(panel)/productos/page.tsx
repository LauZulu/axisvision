import { getAllProducts } from '../../../../src/server/products'
import { ProductsView } from '../../../../src/components/admin/ProductsView'
import { AdminDbError } from '../../../../src/components/admin/AdminDbError'

export const dynamic = 'force-dynamic'

export default async function AdminProductsPage() {
  try {
    const products = await getAllProducts()
    return <ProductsView products={products} />
  } catch {
    return <AdminDbError />
  }
}
