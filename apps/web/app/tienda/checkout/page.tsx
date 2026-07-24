import { Suspense } from 'react'
import { CheckoutClient } from '../../../src/components/store/CheckoutClient'

// useSearchParams exige un límite de Suspense en el server render.
export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutClient />
    </Suspense>
  )
}
