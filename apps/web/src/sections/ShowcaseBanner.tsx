import { useRef } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Img } from '../components/ui/Img'
import { Icon } from '../components/ui/Icon'
import { Magnetic } from '../components/ui/Magnetic'
import { MorphoSheen } from '../components/ui/MorphoSheen'
import { gafasDeFrente as frontImg } from '../lib/siteImages'
import { useDict } from '../i18n/useDict'
import { EASE_OUT_EXPO, inView } from '../lib/motion'

/** Banda cinematográfica full-width — parallax suave + momento de compra a mitad de scroll. */
export function ShowcaseBanner() {
  const { t } = useDict()
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['-8%', '8%'])

  return (
    <section className="border-y border-line">
      <div ref={ref} className="relative h-[46vh] min-h-[340px] w-full overflow-hidden">
        <motion.div style={{ y }} className="absolute inset-x-0 -top-[15%] h-[130%]">
          <Img
            picture={frontImg}
            alt={t.alt.frontBanner}
            sizes="100vw"
            className="h-full w-full object-cover object-center"
          />
        </motion.div>
        {/* Funde los bordes al fondo carbón y oscurece el centro para el CTA */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-carbon-900 via-carbon-900/35 to-carbon-900"
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={inView}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-6 text-center"
        >
          <h2 className="font-display text-[clamp(2rem,4.5vw,3.2rem)] leading-none text-warm-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.5)]">
            {t.banner.title}
          </h2>
          <Magnetic>
            <Link href="/tienda" className="btn-axis bg-carbon-900/55 backdrop-blur-sm">
              {t.banner.cta}
              <Icon name="arrow" size={18} />
              <MorphoSheen />
            </Link>
          </Magnetic>
        </motion.div>
      </div>
    </section>
  )
}
