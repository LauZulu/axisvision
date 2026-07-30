import { motion } from 'framer-motion'
import { Img } from '../components/ui/Img'
import { Reveal } from '../components/ui/Reveal'
import { modelo07, axisEnCafe } from '../lib/siteImages'
import { useDict } from '../i18n/useDict'
import { inViewSoon, settleScale } from '../lib/motion'

/**
 * "Human Stories" — diseño inclusivo contado en escenas cotidianas.
 * Artículos tipográficos escalonados, intercalados con naturalezas muertas:
 * texto y fotografía respirando en la misma retícula, sin tarjetas.
 */
export function HumanStories() {
  const { t } = useDict()
  const [a, b, c, d] = t.stories.examples

  return (
    <section className="section-luxe" aria-label={t.stories.label}>
      <div className="container-axis grid grid-cols-12 gap-x-6 gap-y-20">
        <Reveal className="col-span-12">
          <h2 className="label-luxe">{t.stories.label}</h2>
        </Reveal>

        <Story className="col-span-12 md:col-span-5 md:col-start-1 md:mt-10" {...a} />

        <motion.figure
          variants={settleScale}
          initial="hidden"
          whileInView="show"
          viewport={inViewSoon}
          className="figure-luxe col-span-7 col-start-6 md:col-span-4 md:col-start-8 md:row-span-2"
        >
          <div className="aspect-[9/16] overflow-hidden">
            <Img
              picture={modelo07}
              alt={t.alt.stories[0]}
              sizes="(min-width: 768px) 32vw, 60vw"
              className="h-full w-full object-cover"
            />
          </div>
        </motion.figure>

        <Story className="col-span-12 md:col-span-5 md:col-start-2 md:mt-24" {...b} />

        <Story className="col-span-12 md:col-span-5 md:col-start-7 md:mt-16" {...c} />

        <motion.figure
          variants={settleScale}
          initial="hidden"
          whileInView="show"
          viewport={inViewSoon}
          className="figure-luxe col-span-7 md:col-span-3 md:col-start-2"
        >
          <div className="aspect-[3/4] overflow-hidden">
            <Img
              picture={axisEnCafe}
              alt={t.alt.stories[1]}
              sizes="(min-width: 768px) 24vw, 60vw"
              className="h-full w-full object-cover"
            />
          </div>
        </motion.figure>

        <Story className="col-span-12 md:col-span-5 md:col-start-7 md:-mt-6" {...d} />
      </div>
    </section>
  )
}

function Story({ title, story, className }: { title: string; story: string; className?: string }) {
  return (
    <Reveal as="article" className={className}>
      <h3 className="display-quiet">{title}</h3>
      <p className="lead-luxe mt-5 max-w-[42ch]">{story}</p>
    </Reveal>
  )
}
