import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { TreeLogo } from '../components/ui/TreeLogo'
import { Img } from '../components/ui/Img'
import heroProduct from '../assets/hero/hero-producto-02.jpeg'
import { useDict } from '../i18n/useDict'
import { useScrollTo } from '../lib/scrollContext'
import { whatsappLink } from '../config/brand'
import { EASE_OUT_EXPO } from '../lib/motion'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
}
const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_OUT_EXPO } },
}

// Difumina los bordes del render rectangular para fundirlo con el carbón.
const FEATHER = 'radial-gradient(125% 125% at 50% 45%, #000 56%, transparent 100%)'

export function Hero() {
  const { t } = useDict()
  const scrollTo = useScrollTo()
  const reduce = useReducedMotion()

  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const parallaxY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -90])

  return (
    <section
      ref={ref}
      id="top"
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden pt-28 pb-20"
    >
      {/* Aura Morpho — el único color vibrante, raro */}
      <div
        aria-hidden
        className="bg-morpho pointer-events-none absolute -right-[15%] top-[8%] h-[55vh] w-[55vh] rounded-full opacity-[0.22] blur-[130px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(200,169,110,0.06),transparent_60%)]"
      />

      {/* Árbol filogenético dibujándose como sello de fondo */}
      <TreeLogo
        draw
        className="pointer-events-none absolute right-[-4%] top-1/2 hidden h-[125%] -translate-y-1/2 text-gold/[0.13] lg:block"
      />

      <div className="container-axis relative grid items-center gap-14 md:grid-cols-[1.05fr_0.95fr]">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.span variants={item} className="eyebrow block">
            {t.hero.eyebrow}
          </motion.span>

          <motion.h1
            variants={item}
            className="font-display mt-6 text-[clamp(2.8rem,7vw,5.2rem)] leading-[0.98] font-medium text-warm-white"
          >
            {t.hero.titleLead}
            <br />
            <span className="italic text-warm-white/95">{t.hero.titleAccent}</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-7 max-w-[46ch] text-lg text-warm-gray/85 md:text-xl"
          >
            {t.hero.subtitle}
          </motion.p>

          <motion.div variants={item} className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href={whatsappLink('general')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-axis"
            >
              {t.hero.ctaPrimary}
            </a>
            <button onClick={() => scrollTo('#what')} className="btn-ghost">
              {t.hero.ctaSecondary}
              <span aria-hidden>↓</span>
            </button>
          </motion.div>

          <motion.ul
            variants={item}
            className="mt-10 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-warm-gray/55"
          >
            {t.hero.trust.map((sig) => (
              <li key={sig} className="flex items-center gap-2">
                <span className="inline-block h-1 w-1 rounded-full bg-gold" />
                {sig}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Producto: parallax al scroll + entrada + flotación + destello Morpho */}
        <motion.div style={{ y: parallaxY }} className="relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.3, ease: EASE_OUT_EXPO, delay: 0.35 }}
          >
            <motion.div
              animate={reduce ? undefined : { y: [0, -14, 0] }}
              transition={
                reduce ? undefined : { duration: 7, ease: 'easeInOut', repeat: Infinity }
              }
              className="relative"
              style={{ maskImage: FEATHER, WebkitMaskImage: FEATHER }}
            >
              <Img
                picture={heroProduct}
                alt={t.alt.heroProduct}
                priority
                sizes="(min-width: 768px) 48vw, 92vw"
                className="w-full drop-shadow-[0_40px_80px_rgba(0,0,0,0.55)]"
              />

              {/* Destello iridiscente Morpho que cruza el producto una sola vez */}
              {!reduce && (
                <motion.div
                  aria-hidden
                  initial={{ x: '-140%', opacity: 0 }}
                  animate={{ x: '160%', opacity: [0, 0.55, 0] }}
                  transition={{ duration: 1.9, ease: EASE_OUT_EXPO, delay: 1.1 }}
                  className="bg-morpho pointer-events-none absolute inset-y-0 left-0 w-1/2 -skew-x-12 blur-2xl mix-blend-screen"
                />
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Cue de scroll */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 md:block"
      >
        <div className="h-10 w-[1px] bg-gradient-to-b from-gold/60 to-transparent" />
      </motion.div>
    </section>
  )
}
