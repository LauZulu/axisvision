import Link from 'next/link'

export const dynamic = 'force-dynamic'

/**
 * Página a la que caen los enlaces de los correos de reserva (confirmar / darse
 * de baja). Es server component puro: sin JS, sin i18n de cliente — se abre
 * desde el correo, muchas veces en el navegador interno de una app.
 */
const MENSAJES = {
  confirmada: {
    eyebrow: 'Reserva confirmada',
    title: 'Listo, quedaste en la lista.',
    body: 'Te escribimos a este correo apenas haya unidades disponibles, antes de anunciarlo en cualquier otro lado.',
  },
  baja: {
    eyebrow: 'Baja confirmada',
    title: 'No te escribimos más.',
    body: 'Sacamos tu correo de esa lista de espera. Si cambias de idea, puedes volver a apuntarte desde la ficha del modelo.',
  },
  invalida: {
    eyebrow: 'Enlace no válido',
    title: 'Ese enlace ya no sirve.',
    body: 'Puede que haya vencido o que ya lo hubieras usado. Escríbenos por WhatsApp y lo resolvemos.',
  },
} as const

type Estado = keyof typeof MENSAJES

export default async function ReservaGraciasPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  const { estado } = await searchParams
  const key: Estado = estado === 'confirmada' || estado === 'baja' ? estado : 'invalida'
  const msg = MENSAJES[key]

  return (
    <section className="py-24 md:py-32">
      <div className="container-axis max-w-xl">
        <span className="eyebrow text-gold">{msg.eyebrow}</span>
        <h1 className="mt-4 font-head text-3xl leading-tight font-medium text-warm-white md:text-4xl">
          {msg.title}
        </h1>
        <p className="mt-4 leading-relaxed text-warm-gray/80">{msg.body}</p>
        <Link href="/tienda" className="btn-axis mt-8 inline-flex">
          Ver la tienda
        </Link>
      </div>
    </section>
  )
}
