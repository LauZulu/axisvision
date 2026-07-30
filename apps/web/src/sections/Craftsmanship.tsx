import { motion } from 'framer-motion'
import { Img } from '../components/ui/Img'
import { Reveal } from '../components/ui/Reveal'
import { empaqueAbierto, heroProducto, gafasDeFrente } from '../lib/siteImages'
import { useDict } from '../i18n/useDict'
import { inViewSoon, settleScale } from '../lib/motion'

/**
 * "Craftsmanship" — macrofotografía editorial de materiales, estuche y
 * detalles. Dos figuras desfasadas y una franja ultra-panorámica a sangre:
 * la artesanía se muestra, no se enumera.
 */
export function Craftsmanship() {
  const { t } = useDict()

  return (
    <section id="craftsmanship" className="section-luxe" aria-label={t.craft.label}>
      <div className="container-axis">
        <header className="max-w-3xl">
          <Reveal>
            <p className="label-luxe">{t.craft.label}</p>
          </Reveal>
          <Reveal delay={0.15}>
            <h2 className="display-section mt-8">{t.craft.headline}</h2>
          </Reveal>
        </header>

        <div className="mt-24 grid grid-cols-12 gap-x-6 gap-y-20 md:mt-36">
          <motion.figure
            variants={settleScale}
            initial="hidden"
            whileInView="show"
            viewport={inViewSoon}
            className="figure-luxe col-span-12 md:col-span-7"
          >
            <div className="aspect-[6/5] overflow-hidden">
              <Img
                picture={empaqueAbierto}
                alt={t.alt.craft[0]}
                sizes="(min-width: 768px) 55vw, 100vw"
                className="h-full w-full object-cover"
              />
            </div>
            <figcaption className="font-display mt-5 max-w-[40ch] text-lg text-warm-gray/80 italic">
              {t.craft.captions[1]}
            </figcaption>
          </motion.figure>

          <motion.figure
            variants={settleScale}
            initial="hidden"
            whileInView="show"
            viewport={inViewSoon}
            className="figure-luxe col-span-10 col-start-3 md:col-span-4 md:col-start-9 md:mt-40"
          >
            <div className="aspect-[6/5] overflow-hidden">
              <Img
                picture={heroProducto}
                alt={t.alt.craft[1]}
                sizes="(min-width: 768px) 30vw, 80vw"
                className="h-full w-full object-cover"
              />
            </div>
            <figcaption className="font-display mt-5 max-w-[32ch] text-lg text-warm-gray/80 italic">
              {t.craft.captions[2]}
            </figcaption>
          </motion.figure>
        </div>
      </div>

      {/* Franja a sangre — el objeto, de frente, sin nada alrededor */}
      <motion.figure
        variants={settleScale}
        initial="hidden"
        whileInView="show"
        viewport={inViewSoon}
        className="mt-28 md:mt-44"
      >
        <Img
          picture={gafasDeFrente}
          alt={t.alt.craft[2]}
          sizes="100vw"
          className="w-full"
        />
        <figcaption className="container-axis font-display mt-5 text-lg text-warm-gray/80 italic">
          {t.craft.captions[0]}
        </figcaption>
      </motion.figure>
    </section>
  )
}
