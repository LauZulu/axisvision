import Link from 'next/link'
import { getAllProducts } from '../../../../src/server/products'
import { ProductTable } from '../../../../src/components/admin/ProductTable'

export const dynamic = 'force-dynamic'

export default async function AdminProductsPage() {
  let products
  try {
    products = await getAllProducts()
  } catch {
    return (
      <div className="rounded-2xl border border-line bg-carbon-850 p-8">
        <h1 className="font-head text-xl text-warm-white">Base de datos no disponible</h1>
        <p className="mt-2 text-warm-gray/70">No se pudo cargar el catálogo. Revisa la conexión.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-head text-2xl text-warm-white">Productos</h1>
          <p className="mt-1 text-warm-gray/60">Catálogo, precios y stock.</p>
        </div>
        <Link href="/admin/productos/nuevo" className="btn-axis">
          Nuevo producto
        </Link>
      </div>

      <div className="mt-8">
        <ProductTable products={products} />
      </div>
    </div>
  )
}
