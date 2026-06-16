import { GlassesArt } from '../components/ui/GlassesArt'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Reveal } from '../components/ui/Reveal'
import { Icon } from '../components/ui/Icon'
import { useDict } from '../i18n/useDict'
import { useScrollTo } from '../lib/scrollContext'

export function Clinical() {
  const { t } = useDict()
  const scrollTo = useScrollTo()
  return (
    <section id="clinical" className="border-t border-white/5 py-24 md:py-36">
      <div className="container-axis grid items-center gap-14 lg:grid-cols-2">
        <Reveal className="order-2 lg:order-1">
          <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-carbon-850 p-10 md:p-14">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(200,169,110,0.08),transparent_60%)]"
            />
            <GlassesArt className="relative w-full" glow={0.14} />
            <div className="relative mt-8 inline-flex items-center gap-2.5 rounded-full border border-gold/30 px-4 py-2">
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
