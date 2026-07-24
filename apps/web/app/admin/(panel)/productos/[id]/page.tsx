import { getProductById } from '../../../../../src/server/products'
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
  try {
    product = await getProductById(id)
  } catch {
    return <AdminDbError />
  }
  if (!product) return <AdminProductNotFound />
  return <ProductForm product={product} />
}
