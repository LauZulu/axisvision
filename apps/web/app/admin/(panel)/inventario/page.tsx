import { getProductUnits } from '../../../../src/server/inventory'
import { getAllProducts } from '../../../../src/server/products'
import { InventoryView } from '../../../../src/components/admin/InventoryView'
import { AdminDbError } from '../../../../src/components/admin/AdminDbError'

export const dynamic = 'force-dynamic'

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ producto?: string }>
}) {
  const { producto } = await searchParams
  try {
    // El enlace desde la ficha del producto llega por slug; aquí se traduce a id.
    let productId: string | undefined
    if (producto) {
      const products = await getAllProducts()
      productId = products.find((p) => p.slug === producto)?.id
    }
    return <InventoryView units={await getProductUnits(productId)} />
  } catch (err) {
    console.error('[admin] inventario:', err)
    return <AdminDbError />
  }
}
