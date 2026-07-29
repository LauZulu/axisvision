import { Suspense } from 'react'
import { CheckoutClient } from '../../../src/components/store/CheckoutClient'
import { getActiveLensOptions } from '../../../src/server/lenses'

export const dynamic = 'force-dynamic'

// useSearchParams exige un límite de Suspense en el server render.
export default async function CheckoutPage() {
  // Catálogo de lentes para resolver el de "Comprar ahora" y saber cuáles piden
  // fórmula. Si la DB falla, el checkout sigue funcionando con el lente de fábrica.
  const lensOptions = await getActiveLensOptions().catch(() => [])
  return (
    <Suspense>
      <CheckoutClient lensOptions={lensOptions} />
    </Suspense>
  )
}
