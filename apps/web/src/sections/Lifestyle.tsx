import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Img } from '../components/ui/Img'
import { SectionHeading } from '../components/ui/SectionHeading'
import { useDict } from '../i18n/useDict'
import { fadeUp, inView, stagger } from '../lib/motion'

// Galería de uso real — el orden coincide con t.alt.lifestyle[i].
import {
  modelo06 as modelo06Mujer,
  modelo01,
  modelo07 as cafeCroissant,
  modelo02,
  modelo05,
  axisEnCafe as cafeEstuche,
  modelo03,
  modelo06Ciclista as ciclista,
  modelo08 as cafeLaptop,
  modelo04,
  axisEnCafe02 as cafeSport,
} from '../lib/siteImages'

const GALLERY = [
  modelo06Mujer,
  modelo01,
  cafeCroissant,
  modelo02,
  modelo05,
  cafeEstuche,
  modelo03,
  ciclista,
  cafeLaptop,
  modelo04,
  cafeSport,
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
          {GALLERY.map((pic, i) => (
            <motion.figure key={i} variants={fadeUp} className="mb-4 break-inside-avoid">
              <motion.div
                style={{ y: speeds[i % 3] }}
                className="group relative overflow-hidden rounded-xl border border-line"
              >
                <Img
                  picture={pic}
                  alt={t.alt.lifestyle[i]}
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
