import { getActiveProducts } from '../../src/server/products'
import { StoreGrid } from '../../src/components/store/StoreGrid'
import { StoreUnavailable } from '../../src/components/store/StoreMessage'

// Se renderiza por request (lee la DB); no se prerenderiza en build.
export const dynamic = 'force-dynamic'

export default async function TiendaPage() {
  try {
    const products = await getActiveProducts()
    return <StoreGrid products={products} />
  } catch (err) {
    // La página responde 200 con el aviso de "tienda no disponible", así que sin
    // este log un fallo de DB no deja rastro NI en el status NI en la consola.
    console.error('[tienda] no se pudo cargar el catálogo:', err)
    return <StoreUnavailable />
  }
}
