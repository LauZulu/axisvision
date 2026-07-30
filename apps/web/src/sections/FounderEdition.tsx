import { motion } from 'framer-motion'
import { Img } from '../components/ui/Img'
import { Reveal } from '../components/ui/Reveal'
import { empaqueCerrado } from '../lib/siteImages'
import { useDict } from '../i18n/useDict'
import { inViewSoon, settleScale, stagger, fadeUp, inView } from '../lib/motion'

/**
 * "Founder Edition" — el pico emocional (Peak-End Rule). El único bloque de
 * tinta de toda la página: integrado como capítulo, no como caja. La lista es
 * tipografía numerada en bronce — sin iconos de checklist, sin bordes.
 * La escasez se dice una sola vez, en voz baja (Loss Aversion).
 */
export function FounderEdition() {
  const { t } = useDict()

  return (
    <section id="founder" className="bg-ink" aria-label={t.founder.label}>
      <div className="container-axis section-luxe">
        <div className="grid grid-cols-12 gap-x-6 gap-y-20">
          <header className="col-span-12 md:col-span-5">
            <Reveal>
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.26em] text-bronze">
                {t.founder.label}
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <h2 className="display-section text-canvas mt-8">{t.founder.headline}</h2>
            </Reveal>
            <Reveal delay={0.3}>
              <p className="font-display mt-10 text-xl text-canvas/55 italic">
                {t.founder.note}
              </p>
            </Reveal>
          </header>

          <motion.ol
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={inView}
            className="col-span-12 md:col-span-5 md:col-start-8 md:mt-6"
          >
            {t.founder.elements.map((element, i) => (
              <motion.li key={element} variants={fadeUp} className="flex items-baseline gap-8 py-6">
                <span className="font-mono text-[0.62rem] tracking-[0.3em] text-bronze">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="font-display text-2xl text-canvas md:text-[1.7rem]">
                  {element}
                </span>
              </motion.li>
            ))}
          </motion.ol>

          <motion.figure
            variants={settleScale}
            initial="hidden"
            whileInView="show"
            viewport={inViewSoon}
            className="figure-luxe col-span-12 md:col-span-8 md:col-start-3 md:mt-10"
          >
            <Img
              picture={empaqueCerrado}
              alt={t.alt.founder}
              sizes="(min-width: 768px) 66vw, 100vw"
              className="w-full"
            />
          </motion.figure>
        </div>
      </div>
    </section>
  )
}
