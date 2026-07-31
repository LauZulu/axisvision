import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Img } from '../components/ui/Img'
import { SectionHeading } from '../components/ui/SectionHeading'
import { useDict } from '../i18n/useDict'
import { fadeUp, inView, stagger } from '../lib/motion'

import {
  modelo06 as modelo06Mujer,
  modelo01,
  modelo02,
  modelo05,
  modelo03,
  modelo06Ciclista as ciclista,
  modelo04,
} from '../lib/siteImages'

/**
 * Galería de uso real. Solo fotos de gente llevando AXIS, que es lo que promete
 * el copy de la sección ("Personas reales llevando AXIS. Así se verá contigo").
 * Se quitaron las cuatro naturalezas muertas del estuche —tres eran la misma
 * idea, el estuche sobre una mesa de café— que además dejaban esta sección como
 * la más larga de la página con diferencia.
 *
 * `alt` es el índice dentro de t.alt.lifestyle: va explícito para que quitar o
 * reordenar fotos no desplace los textos alternativos.
 */
const GALLERY = [
  { pic: modelo06Mujer, alt: 0 },
  { pic: modelo01, alt: 1 },
  { pic: modelo02, alt: 3 },
  { pic: modelo05, alt: 4 },
  { pic: modelo03, alt: 6 },
  { pic: ciclista, alt: 7 },
  { pic: modelo04, alt: 9 },
]

export function Lifestyle() {
  const { t } = useDict()
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })

  // Tres velocidades de parallax, asignadas por columna (i % 3).
  const yA = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [30, -30])
  const yB = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-24, 24])
  const yC = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [14, -14])
  const speeds = [yA, yB, yC]

  return (
    <section id="lifestyle" className="border-t border-line py-24 md:py-36">
      <div className="container-axis">
        <SectionHeading
          eyebrow={t.lifestyle.eyebrow}
          title={t.lifestyle.title}
          intro={t.lifestyle.intro}
          align="center"
          className="mx-auto max-w-3xl"
        />

        <motion.div
          ref={ref}
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="mt-14 columns-2 gap-4 md:columns-3 [column-fill:_balance]"
        >
          {GALLERY.map((shot, i) => (
            <motion.figure key={i} variants={fadeUp} className="mb-4 break-inside-avoid">
              <motion.div
                style={{ y: speeds[i % 3] }}
                className="group relative overflow-hidden rounded-xl border border-line"
              >
                <Img
                  picture={shot.pic}
                  alt={t.alt.lifestyle[shot.alt]}
                  sizes="(min-width: 768px) 30vw, 45vw"
                  className="w-full transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-carbon-900/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
              </motion.div>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
