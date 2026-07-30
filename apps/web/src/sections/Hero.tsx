import { useRef } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Img } from '../components/ui/Img'
import { heroProducto02 as heroProduct } from '../lib/siteImages'
import { useDict } from '../i18n/useDict'
import { EASE_LUXE } from '../lib/motion'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.18, delayChildren: 0.25 } },
}
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 1.1, ease: EASE_LUXE } },
}

/**
 * Hero: una sola idea — la frase. La fotografía llega después, a pantalla
 * completa, con un asentamiento lento y parallax suave. Sin color de acento:
 * el énfasis se reserva para el final de la página (Von Restorff).
 */
export function Hero() {
  const { t } = useDict()
  const reduce = useReducedMotion()

  const figRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: figRef, offset: ['start end', 'end start'] })
  const parallaxY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [40, -40])

  return (
    <section aria-label={t.hero.headline}>
      {/* La idea */}
      <div className="container-axis flex min-h-[92svh] items-center pt-16 md:pt-[72px]">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mx-auto w-full text-center"
        >
          <motion.h1 variants={item} className="display-hero mx-auto max-w-[16ch]">
            {t.hero.headline}
          </motion.h1>
          <motion.p variants={item} className="lead-luxe mx-auto mt-8 max-w-[36ch]">
            {t.hero.subheadline}
          </motion.p>
          <motion.div variants={item} className="mt-14">
            <Link href="/tienda" className="btn-ink">
              {t.hero.cta}
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* La fotografía — plena, sin marcos ni sombras */}
      <motion.div
        ref={figRef}
        initial={reduce ? undefined : { opacity: 0, scale: 1.05 }}
        whileInView={reduce ? undefined : { opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1.6, ease: EASE_LUXE }}
        className="overflow-hidden"
      >
        <motion.figure style={{ y: parallaxY }} className="relative -my-10">
          <Img
            picture={heroProduct}
            alt={t.alt.hero}
            sizes="100vw"
            className="max-h-[88svh] w-full object-cover"
          />
        </motion.figure>
      </motion.div>
    </section>
  )
}
