import Link from 'next/link'
import { getProductById } from '../../../../../src/server/products'
import { ProductForm } from '../../../../../src/components/admin/ProductForm'

export const dynamic = 'force-dynamic'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let product
  try {
    product = await getProductById(id)
  } catch {
    return (
      <div className="rounded-2xl border border-line bg-carbon-850 p-8">
        <p className="text-warm-gray/70">Base de datos no disponible.</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="rounded-2xl border border-line bg-carbon-850 p-8">
        <h1 className="font-head text-xl text-warm-white">Producto no encontrado</h1>
        <Link href="/admin/productos" className="btn-axis mt-6 inline-flex">
          Volver a productos
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-head text-2xl text-warm-white">Editar producto</h1>
      <p className="mt-1 font-mono text-xs text-warm-gray/45">{product.slug}</p>
      <div className="mt-8">
        <ProductForm product={product} />
      </div>
    </div>
  )
}
