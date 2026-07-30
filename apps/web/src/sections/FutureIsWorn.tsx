import { motion } from 'framer-motion'
import { Img } from '../components/ui/Img'
import { Reveal } from '../components/ui/Reveal'
import { modelo01, modelo02 } from '../lib/siteImages'
import { useDict } from '../i18n/useDict'
import { inViewSoon, settleScale } from '../lib/motion'

/**
 * "The Future is Worn" — vende identidad antes que tecnología.
 * Retrato grande + retrato menor desfasado: ritmo editorial asimétrico,
 * sin tarjetas, sin bordes; solo tipografía y fotografía.
 */
export function FutureIsWorn() {
  const { t } = useDict()

  return (
    <section className="section-luxe" aria-label={t.future.label}>
      <div className="container-axis grid grid-cols-12 items-start gap-x-6 gap-y-16">
        <header className="col-span-12 md:col-span-6">
          <Reveal>
            <p className="label-luxe">{t.future.label}</p>
          </Reveal>
          <Reveal delay={0.15}>
            <h2 className="display-section mt-8 max-w-[16ch]">{t.future.headline}</h2>
          </Reveal>
        </header>

        <motion.figure
          variants={settleScale}
          initial="hidden"
          whileInView="show"
          viewport={inViewSoon}
          className="figure-luxe col-span-12 md:col-span-5 md:col-start-8 md:-mt-10"
        >
          <div className="aspect-[3/4] overflow-hidden">
            <Img
              picture={modelo01}
              alt={t.alt.future[0]}
              sizes="(min-width: 768px) 40vw, 100vw"
              className="h-full w-full object-cover"
            />
          </div>
        </motion.figure>

        <motion.figure
          variants={settleScale}
          initial="hidden"
          whileInView="show"
          viewport={inViewSoon}
          className="figure-luxe col-span-8 col-start-3 md:col-span-4 md:col-start-2 md:mt-24"
        >
          <div className="aspect-[3/4] overflow-hidden">
            <Img
              picture={modelo02}
              alt={t.alt.future[1]}
              sizes="(min-width: 768px) 30vw, 70vw"
              className="h-full w-full object-cover"
            />
          </div>
        </motion.figure>
      </div>
    </section>
  )
}
