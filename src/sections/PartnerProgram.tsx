import { motion } from 'framer-motion'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Reveal } from '../components/ui/Reveal'
import { Icon } from '../components/ui/Icon'
import { TreeLogo } from '../components/ui/TreeLogo'
import { useDict } from '../i18n/useDict'
import { whatsappLink } from '../config/brand'
import { fadeUp, inView, stagger } from '../lib/motion'

export function PartnerProgram() {
  const { t } = useDict()
  return (
    <section id="program" className="border-t border-white/5 py-24 md:py-36">
      <div className="container-axis">
        <SectionHeading
          eyebrow={t.program.eyebrow}
          title={t.program.title}
          align="center"
          className="mx-auto max-w-3xl"
        />

        {/* Pasos conectados por línea dorada (eco del cladograma) */}
        <motion.ol
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="relative mt-16 grid gap-8 md:grid-cols-3"
        >
          <div
            aria-hidden
            className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent md:block"
          />
          {t.program.steps.map((s) => (
            <motion.li key={s.n} variants={fadeUp} className="relative">
              <div className="relative z-10 grid h-14 w-14 place-items-center rounded-full border border-gold/40 bg-carbon-900 font-mono text-gold">
                {s.n}
              </div>
              <h3 className="font-head mt-6 text-lg font-medium text-warm-white">{s.title}</h3>
              <p className="mt-2 text-warm-gray/75">{s.desc}</p>
            </motion.li>
          ))}
        </motion.ol>

        {/* Qué recibes */}
        <div className="relative mt-16 overflow-hidden rounded-2xl border border-white/8 bg-carbon-850 p-8 md:p-12">
          <TreeLogo className="pointer-events-none absolute -right-8 top-1/2 h-[140%] -translate-y-1/2 text-gold/[0.07]" />
          <div className="relative">
            <h3 className="font-head text-xl text-warm-white">{t.program.includesTitle}</h3>
            <ul className="mt-7 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {t.program.includes.map((inc, i) => (
                <Reveal as="li" key={inc} delay={i * 0.04} className="flex items-center gap-3">
                  <span className="text-gold">
                    <Icon name="check" size={18} />
                  </span>
                  <span className="text-warm-gray">{inc}</span>
                </Reveal>
              ))}
            </ul>
            <a
              href={whatsappLink('optica')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-axis mt-10"
            >
              {t.program.cta}
              <Icon name="whatsapp" size={18} />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
