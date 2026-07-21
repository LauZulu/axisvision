import { motion } from 'framer-motion'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Icon, type IconKey } from '../components/ui/Icon'
import { useDict } from '../i18n/useDict'
import { fadeUp, inView, stagger } from '../lib/motion'

const SIGNAL_ICONS: IconKey[] = [
  'warranty',
  'registered',
  'clinical',
  'support',
  'supply',
  'continuity',
]

export function TrustSignals() {
  const { t } = useDict()
  return (
    <section id="trust" className="border-t border-line py-24 md:py-36">
      <div className="container-axis">
        <SectionHeading
          eyebrow={t.trust.eyebrow}
          title={t.trust.title}
          align="center"
          className="mx-auto max-w-3xl"
        />
        <motion.ul
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="mt-16 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
        >
          {t.trust.signals.map((s, i) => (
            <motion.li key={s.title} variants={fadeUp} className="flex gap-4">
              <span className="mt-0.5 shrink-0 text-gold">
                <Icon name={SIGNAL_ICONS[i]} size={26} strokeWidth={1.4} />
              </span>
              <div>
                <h3 className="font-head text-base font-medium text-warm-white">{s.title}</h3>
                <p className="mt-1.5 text-[0.95rem] text-warm-gray/70">{s.desc}</p>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
