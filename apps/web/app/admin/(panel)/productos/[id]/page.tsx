import { getProductById } from '../../../../../src/server/products'
import { getActiveLensOptions } from '../../../../../src/server/lenses'
import { ProductForm } from '../../../../../src/components/admin/ProductForm'
import { AdminDbError, AdminProductNotFound } from '../../../../../src/components/admin/AdminDbError'

export const dynamic = 'force-dynamic'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let product
  // Las opciones de lente son para previsualizar qué fotos verá el cliente con
  // cada una; se piden en el mismo viaje que el producto.
  let lensOptions
  try {
    ;[product, lensOptions] = await Promise.all([getProductById(id), getActiveLensOptions()])
  } catch (err) {
    console.error('[admin] ficha de producto %s:', id, err)
    return <AdminDbError />
  }
  if (!product) return <AdminProductNotFound />
  return <ProductForm product={product} lensOptions={lensOptions} />
}
