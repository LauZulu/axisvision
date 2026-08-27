import { Suspense } from 'react'
import Link from 'next/link'
import { CheckoutClient } from '../../../src/components/store/CheckoutClient'
import { getActiveLensOptions } from '../../../src/server/lenses'
import { getRxPrices } from '../../../src/server/lensPricing'
import { canCheckout } from '../../../src/server/storeMode'

export const dynamic = 'force-dynamic'

// useSearchParams exige un límite de Suspense en el server render.
export default async function CheckoutPage() {
  // Tienda sin pagos abiertos: ni siquiera se monta el checkout. La ficha de
  // producto ya no muestra el botón de comprar, pero a esta URL se llega por un
  // enlace viejo o escribiéndola, y un formulario de pago que no cobra es peor
  // que no tener formulario.
  if (!canCheckout()) return <CheckoutClosed />

  // Catálogo de lentes para resolver el de "Comprar ahora" y saber cuáles piden
  // fórmula. Si la DB falla, el checkout sigue funcionando con el lente de fábrica.
  const [lensOptions, rxPrices] = await Promise.all([
    getActiveLensOptions().catch(() => []),
    getRxPrices().catch(() => []),
  ])
  return (
    <Suspense>
      <CheckoutClient lensOptions={lensOptions} rxPrices={rxPrices} />
    </Suspense>
  )
}

function CheckoutClosed() {
  return (
    <section className="py-24 md:py-32">
      <div className="container-axis max-w-xl">
        <span className="eyebrow text-gold">Compra en línea próximamente</span>
        <h1 className="mt-4 font-head text-3xl leading-tight font-medium text-warm-white md:text-4xl">
          Ya puedes tener tus AXIS.
        </h1>
        <p className="mt-4 leading-relaxed text-warm-gray/80">
          Muy pronto podrás pagar aquí mismo. Mientras tanto, entra a cualquier modelo y déjanos tu
          contacto: te escribimos por WhatsApp y completamos la compra contigo.
        </p>
        <Link href="/tienda" className="btn-axis mt-8 inline-flex">
          Ver los modelos
        </Link>
      </div>
    </section>
  )
}
