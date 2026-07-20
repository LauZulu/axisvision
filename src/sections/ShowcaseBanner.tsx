import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Img } from '../components/ui/Img'
import frontImg from '../assets/packaging/gafas-de-frente.jpeg?picture'
import { useDict } from '../i18n/useDict'

/** Banda cinematográfica full-width entre secciones — parallax suave del producto. */
export function ShowcaseBanner() {
  const { t } = useDict()
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['-8%', '8%'])

  return (
    <section className="border-y border-line">
      <div ref={ref} className="relative h-[42vh] min-h-[300px] w-full overflow-hidden">
        <motion.div style={{ y }} className="absolute inset-x-0 -top-[15%] h-[130%]">
          <Img
            picture={frontImg}
            alt={t.alt.frontBanner}
            sizes="100vw"
            className="h-full w-full object-cover object-center"
          />
        </motion.div>
        {/* Funde los bordes al fondo carbón de las secciones vecinas */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-carbon-900 via-transparent to-carbon-900"
        />
      </div>
    </section>
  )
}
