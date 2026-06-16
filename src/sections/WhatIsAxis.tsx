import { motion } from 'framer-motion'
import { Reveal } from '../components/ui/Reveal'
import { Icon, type IconKey } from '../components/ui/Icon'
import { useDict } from '../i18n/useDict'
import { fadeUp, inView, stagger } from '../lib/motion'

const PILLAR_ICONS: IconKey[] = ['ai', 'photo', 'translate', 'lens']

export function WhatIsAxis() {
  const { t } = useDict()
  return (
    <section id="what" className="border-t border-white/5 py-24 md:py-36">
      <div className="container-axis">
        <Reveal className="mx-auto max-w-[24ch] text-center">
          <span className="eyebrow">{t.what.eyebrow}</span>
        </Reveal>
        <Reveal delay={0.06}>
          <p className="font-display mx-auto mt-6 max-w-[20ch] text-center text-[clamp(1.8rem,4vw,3rem)] leading-[1.12] text-warm-white md:max-w-[26ch]">
            {t.what.statement}
          </p>
        </Reveal>

        <motion.ul
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="mt-16 grid gap-px overflow-hidden rounded-xl border border-white/8 bg-white/5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {t.what.pillars.map((p, i) => (
            <motion.li
              key={p.title}
              variants={fadeUp}
              className="bg-carbon-900 p-7 transition-colors duration-500 hover:bg-carbon-850"
            >
              <span className="text-gold">
                <Icon name={PILLAR_ICONS[i]} size={28} strokeWidth={1.4} />
              </span>
              <h3 className="font-head mt-5 text-lg font-medium text-warm-white">{p.title}</h3>
              <p className="mt-2 text-[0.97rem] text-warm-gray/75">{p.desc}</p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
