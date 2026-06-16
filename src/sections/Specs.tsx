import { motion } from 'framer-motion'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Icon, type IconKey } from '../components/ui/Icon'
import { useDict } from '../i18n/useDict'
import { fadeUp, inView, stagger } from '../lib/motion'

const GROUP_ICONS: Record<string, IconKey> = {
  capture: 'video',
  intelligence: 'ai',
  sound: 'audio',
  connectivity: 'connectivity',
  battery: 'battery',
  design: 'design',
}

export function Specs() {
  const { t } = useDict()
  return (
    <section id="specs" className="border-t border-white/5 py-24 md:py-36">
      <div className="container-axis">
        <SectionHeading eyebrow={t.specs.eyebrow} title={t.specs.title} intro={t.specs.intro} />

        <motion.ul
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {t.specs.groups.map((g) => (
            <motion.li
              key={g.key}
              variants={fadeUp}
              className="group rounded-xl border border-white/8 bg-carbon-850 p-7 transition-colors duration-500 hover:border-gold/25"
            >
              <div className="flex items-center gap-3">
                <span className="inline-grid h-10 w-10 place-items-center rounded-lg border border-gold/25 text-gold">
                  <Icon name={GROUP_ICONS[g.key]} size={20} strokeWidth={1.4} />
                </span>
                <h3 className="font-mono text-[0.72rem] uppercase tracking-[0.2em] text-gold">
                  {g.title}
                </h3>
              </div>
              <ul className="mt-5">
                {g.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-baseline gap-3 border-t border-white/8 py-2.5 text-[0.95rem] text-warm-gray/80 first:border-t-0"
                  >
                    <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-gold/70" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
