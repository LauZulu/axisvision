import { SectionHeading } from '../components/ui/SectionHeading'
import { Reveal } from '../components/ui/Reveal'
import { Icon } from '../components/ui/Icon'
import { ImageCarousel } from '../components/ui/ImageCarousel'
import { useDict } from '../i18n/useDict'
import { useScrollTo } from '../lib/scrollContext'

// Ejemplos reales de personas usando AXIS (el índice de alt es el de t.alt.lifestyle).
import modelo01 from '../assets/lifestyle/modelo-01.jpg?picture'
import modelo06 from '../assets/lifestyle/modelo-06.jpg?picture'
import modelo03 from '../assets/lifestyle/modelo-03.jpg?picture'
import modelo02 from '../assets/lifestyle/modelo-02.jpg?picture'
import modelo05 from '../assets/lifestyle/modelo-05.jpeg?picture'
import modelo04 from '../assets/lifestyle/modelo-04.jpg?picture'

const SLIDES = [
  { pic: modelo01, alt: 1 },
  { pic: modelo06, alt: 0 },
  { pic: modelo03, alt: 6 },
  { pic: modelo02, alt: 3 },
  { pic: modelo05, alt: 4 },
  { pic: modelo04, alt: 9 },
] as const

export function Clinical() {
  const { t } = useDict()
  const scrollTo = useScrollTo()
  return (
    <section id="clinical" className="border-t border-white/5 py-24 md:py-36">
      <div className="container-axis grid items-center gap-14 lg:grid-cols-2">
        <Reveal className="order-2 lg:order-1">
          <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-carbon-850">
            <ImageCarousel
              slides={SLIDES.map((s) => ({ pic: s.pic, alt: t.alt.lifestyle[s.alt] }))}
              sizes="(min-width: 1024px) 46vw, 92vw"
              className="aspect-[4/5] w-full md:aspect-[5/4]"
            />
            {/* Degradados para legibilidad del sello (arriba) y los puntos (abajo) */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-carbon-900/60 to-transparent"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-carbon-900/50 to-transparent"
            />
            <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-2.5 rounded-full border border-gold/30 bg-carbon-900/70 px-4 py-2 backdrop-blur">
              <span className="text-gold">
                <Icon name="clinical" size={18} />
              </span>
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-gold">
                {t.clinical.badge}
              </span>
            </div>
          </div>
        </Reveal>

        <div className="order-1 lg:order-2">
          <SectionHeading eyebrow={t.clinical.eyebrow} title={t.clinical.title} intro={t.clinical.body} />
          <ul className="mt-8 flex flex-col gap-3">
            {t.clinical.points.map((p, i) => (
              <Reveal as="li" key={p} delay={i * 0.06} className="flex items-center gap-3">
                <span className="text-gold">
                  <Icon name="check" size={18} />
                </span>
                <span className="text-warm-gray">{p}</span>
              </Reveal>
            ))}
          </ul>
          <Reveal delay={0.2} className="mt-9">
            <button onClick={() => scrollTo('#contact')} className="btn-ghost">
              {t.clinical.cta}
              <Icon name="arrow" size={18} />
            </button>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
