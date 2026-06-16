import { motion } from 'framer-motion'
import { SectionHeading } from '../components/ui/SectionHeading'
import { CountUp } from '../components/ui/CountUp'
import { Icon, type IconKey } from '../components/ui/Icon'
import { useDict } from '../i18n/useDict'
import { whatsappLink } from '../config/brand'
import { fadeUp, inView, stagger } from '../lib/motion'

const CARD_ICONS: IconKey[] = ['margin', 'demand', 'norisk', 'display', 'territory', 'brand']

export function BusinessOpportunity() {
  const { t } = useDict()
  return (
    <section id="business" className="relative border-t border-white/5 py-24 md:py-36">
      <div
        aria-hidden
        className="bg-morpho pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full opacity-[0.1] blur-[120px]"
      />
      <div className="container-axis relative">
        <SectionHeading
          eyebrow={t.business.eyebrow}
          title={t.business.title}
          intro={t.business.intro}
          align="center"
          className="mx-auto max-w-3xl"
        />

        {/* Argumentos */}
        <motion.ul
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {t.business.cards.map((c, i) => (
            <motion.li
              key={c.title}
              variants={fadeUp}
              className="group rounded-xl border border-white/8 bg-carbon-850 p-7 transition-colors duration-500 hover:border-gold/30"
            >
              <span className="inline-grid h-12 w-12 place-items-center rounded-lg border border-gold/25 text-gold transition-colors duration-500 group-hover:bg-gold/5">
                <Icon name={CARD_ICONS[i]} size={24} strokeWidth={1.4} />
              </span>
              <h3 className="font-head mt-5 text-lg font-medium text-warm-white">{c.title}</h3>
              <p className="mt-2 text-[0.97rem] text-warm-gray/75">{c.desc}</p>
            </motion.li>
          ))}
        </motion.ul>

        {/* Cifras (count-up) */}
        <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/5 md:grid-cols-4">
          {t.business.stats.map((s) => (
            <div key={s.label} className="bg-carbon-900 p-7 text-center">
              <div className="font-display text-4xl text-warm-white md:text-5xl">
                <CountUp value={Number(s.value)} suffix={s.suffix} />
              </div>
              <p className="mt-2 text-xs uppercase tracking-[0.12em] text-warm-gray/55">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href={whatsappLink('general')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-axis"
          >
            {t.business.cta}
            <Icon name="arrow" size={18} />
          </a>
          <p className="mt-4 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-warm-gray/45">
            {t.business.disclaimer}
          </p>
        </div>
      </div>
    </section>
  )
}
