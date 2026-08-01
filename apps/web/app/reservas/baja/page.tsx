import Link from 'next/link'

export const dynamic = 'force-dynamic'

/**
 * Confirmación de baja. Un solo botón, sin JavaScript: es un `<form method="post">`
 * normal, porque a esta página se llega desde el correo y a veces se abre en el
 * navegador interno de una app.
 *
 * Existe esta página en vez de dar de baja directamente en el enlace porque los
 * escáneres de correo abren todos los enlaces de un mensaje; con la baja en el
 * GET, darían de baja a gente que nunca pulsó nada. Un botón no lo pulsa un
 * escáner. Para la persona sigue siendo un clic.
 */
export default async function ReservaBajaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return (
      <section className="py-24 md:py-32">
        <div className="container-axis max-w-xl">
          <span className="eyebrow text-gold">Enlace no válido</span>
          <h1 className="mt-4 font-head text-3xl leading-tight font-medium text-warm-white md:text-4xl">
            Ese enlace ya no sirve.
          </h1>
          <p className="mt-4 leading-relaxed text-warm-gray/80">
            Puede que haya vencido o que ya lo hubieras usado. Escríbenos por WhatsApp y lo
            resolvemos.
          </p>
          <Link href="/tienda" className="btn-axis mt-8 inline-flex">
            Ver la tienda
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="py-24 md:py-32">
      <div className="container-axis max-w-xl">
        <span className="eyebrow text-gold">Dar de baja</span>
        <h1 className="mt-4 font-head text-3xl leading-tight font-medium text-warm-white md:text-4xl">
          ¿Dejamos de avisarte?
        </h1>
        <p className="mt-4 leading-relaxed text-warm-gray/80">
          Si confirmas, borramos tu correo de la lista de espera de ese modelo y no volvemos a
          escribirte por él. Los correos de un pedido tuyo, si llegas a comprar, siguen llegando
          aparte.
        </p>
        <form method="post" action="/api/reservas/baja" className="mt-8 flex flex-wrap gap-3">
          <input type="hidden" name="token" value={token} />
          <button type="submit" className="btn-axis">
            Sí, darme de baja
          </button>
          <Link
            href="/tienda"
            className="inline-flex items-center justify-center rounded-md border border-line px-6 py-[0.95rem] font-head text-sm text-warm-gray/80 transition-colors hover:border-gold/50 hover:text-gold"
          >
            Mejor no
          </Link>
        </form>
      </div>
    </section>
  )
}
