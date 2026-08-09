import { getProductBySlug } from '../../../src/server/products'
import { getActiveLensOptions } from '../../../src/server/lenses'
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
    const [product, lensOptions] = await Promise.all([
      getProductBySlug(slug),
      getActiveLensOptions(),
    ])
    if (!product) return <StoreNotFound />
    return <ProductDetail product={product} lensOptions={lensOptions} />
  } catch (err) {
    // Igual que en /tienda: la página responde 200 con el aviso, así que sin
    // este log el fallo no deja rastro NI en el status NI en la consola.
    console.error('[tienda] no se pudo cargar la ficha:', err)
    return <StoreUnavailable />
  }
}
