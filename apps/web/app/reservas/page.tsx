import type { Metadata } from 'next'
import { getActiveProducts } from '../../src/server/products'
import { ReservaPicker } from '../../src/components/store/ReservaPicker'
import { StoreUnavailable } from '../../src/components/store/StoreMessage'

// Lee la DB en cada request: no se prerenderiza en build.
export const dynamic = 'force-dynamic'

/**
 * Página de captación de la promoción: elegir modelo y dejar el contacto.
 *
 * Es el enlace que se publica en redes, así que los metadatos importan tanto
 * como la página — lo que se ve al pegarlo en una historia o en un chat es esta
 * tarjeta, no el `<h1>`. Título propio (no el de la landing) para que quien lo
 * reciba reenviado sepa a qué está entrando.
 *
 * `?modelo=<slug>` preselecciona un modelo: un solo enlace por modelo para cada
 * publicación, y el genérico sin parámetro para el perfil.
 */
export const metadata: Metadata = {
  title: 'Compra tus AXIS — gafas con inteligencia artificial',
  description:
    'Elige el modelo que te gustó y déjanos tu WhatsApp. Te escribimos con los siguientes pasos.',
  openGraph: {
    type: 'website',
    title: 'Compra tus AXIS',
    description: 'Elige tu modelo y déjanos tu WhatsApp. Te escribimos con los siguientes pasos.',
  },
}

export default async function ReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ modelo?: string }>
}) {
  const { modelo } = await searchParams
  try {
    const products = await getActiveProducts()
    return <ReservaPicker products={products} initialSlug={modelo} />
  } catch (err) {
    // Responde 200 con el aviso de "no disponible": sin este log, un fallo de DB
    // no dejaría rastro ni en el status ni en la consola.
    console.error('[reservas] no se pudo cargar el catálogo:', err)
    return <StoreUnavailable />
  }
}
