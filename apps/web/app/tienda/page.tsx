import { getActiveProducts } from '../../src/server/products'
import { StoreGrid } from '../../src/components/store/StoreGrid'
import { StoreUnavailable } from '../../src/components/store/StoreMessage'

// Se renderiza por request (lee la DB); no se prerenderiza en build.
export const dynamic = 'force-dynamic'

export default async function TiendaPage() {
  try {
    const products = await getActiveProducts()
    return <StoreGrid products={products} />
  } catch {
    return <StoreUnavailable />
  }
}
