import { motion } from 'framer-motion'
import { Img } from '../components/ui/Img'
import { Reveal } from '../components/ui/Reveal'
import { modelo06, modelo04, modelo08, modelo03 } from '../lib/siteImages'
import { useDict } from '../i18n/useDict'
import { inViewSoon, settleScale } from '../lib/motion'

// Una fotografía por momento; el orden coincide con t.experience.stories.
const MOMENTS = [modelo06, modelo04, modelo08, modelo03]

/**
 * "Experience AXIS" — momentos, no características. Cada historia ocupa su
 * propia pantalla: un índice, una frase, una fotografía. Nada más.
 */
export function ExperienceAxis() {
  const { t } = useDict()

  return (
    <section className="section-luxe" aria-label={t.experience.label}>
      <div className="container-axis">
        <Reveal>
          <h2 className="label-luxe">{t.experience.label}</h2>
        </Reveal>
      </div>

      {t.experience.stories.map((story, i) => {
        const reversed = i % 2 === 1
        return (
          <article
            key={story}
            className="container-axis grid min-h-[85svh] grid-cols-12 content-center items-center gap-x-6 gap-y-12 py-16 md:py-0"
          >
            <motion.figure
              variants={settleScale}
              initial="hidden"
              whileInView="show"
              viewport={inViewSoon}
              className={`figure-luxe col-span-12 md:col-span-5 ${
                reversed ? 'md:col-start-8' : 'md:col-start-1'
              }`}
            >
              <div className="aspect-[3/4] overflow-hidden">
                <Img
                  picture={MOMENTS[i]}
                  alt={t.alt.experience[i]}
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className="h-full w-full object-cover"
                />
              </div>
            </motion.figure>

            <div
              className={`col-span-12 md:col-span-5 ${
                reversed ? 'md:col-start-2 md:row-start-1' : 'md:col-start-7'
              }`}
            >
              <Reveal>
                <p className="font-mono text-[0.62rem] tracking-[0.3em] text-warm-gray/75">
                  {String(i + 1).padStart(2, '0')}
                </p>
              </Reveal>
              <Reveal delay={0.15}>
                <h3 className="display-quiet mt-6 max-w-[18ch]">{story}</h3>
              </Reveal>
            </div>
          </article>
        )
      })}
    </section>
  )
}
