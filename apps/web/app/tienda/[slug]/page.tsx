import { getProductBySlug } from '../../../src/server/products'
import { ProductDetail } from '../../../src/components/store/ProductDetail'
import { StoreNotFound, StoreUnavailable } from '../../../src/components/store/StoreMessage'

export const dynamic = 'force-dynamic'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  try {
    const product = await getProductBySlug(slug)
    if (!product) return <StoreNotFound />
    return <ProductDetail product={product} />
  } catch {
    return <StoreUnavailable />
  }
}
