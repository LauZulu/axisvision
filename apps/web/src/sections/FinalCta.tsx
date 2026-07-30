import Link from 'next/link'
import { Reveal } from '../components/ui/Reveal'
import { useDict } from '../i18n/useDict'

/**
 * Cierre — una frase, un botón, nada más. El último uso (y el más deliberado)
 * del énfasis: el CTA final de la página (Von Restorff + Peak-End).
 */
export function FinalCta() {
  const { t } = useDict()

  return (
    <section className="flex min-h-[85svh] items-center" aria-label={t.finalCta.headline}>
      <div className="container-axis text-center">
        <Reveal>
          <h2 className="display-hero mx-auto max-w-[14ch]">{t.finalCta.headline}</h2>
        </Reveal>
        <Reveal delay={0.25}>
          <div className="mt-14">
            <Link href="/tienda" className="btn-ink">
              {t.finalCta.button}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
