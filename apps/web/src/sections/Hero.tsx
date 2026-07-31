import { useRef } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Icon } from '../components/ui/Icon'
import { Img } from '../components/ui/Img'
import { Magnetic } from '../components/ui/Magnetic'
import { MorphoSheen } from '../components/ui/MorphoSheen'
import { heroProducto as portadaCarbon, empaqueAbierto as portadaCrema } from '../lib/siteImages'
import { useDict } from '../i18n/useDict'
import { useScrollTo } from '../lib/scrollContext'
import { EASE_OUT_EXPO } from '../lib/motion'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.35 } },
}
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 1, ease: EASE_OUT_EXPO } },
}

export function Hero() {
  const { t } = useDict()
  const scrollTo = useScrollTo()
  const reduce = useReducedMotion()

  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  // La foto se queda atrás respecto al texto (parallax) y el bloque central se
  // desvanece al salir: la portada cede el paso a la vitrina sin corte seco.
  const fondoY = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['0%', '12%'])
  const textoY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -70])
  const textoOpacity = useTransform(scrollYProgress, [0, 0.7], reduce ? [1, 1] : [1, 0])

  return (
    <section
      ref={ref}
      id="top"
      className="relative isolate flex min-h-[100svh] items-center justify-center overflow-hidden pt-28 pb-24 text-center"
    >
      {/* Portada a sangre. La MISMA composición existe con fondo carbón y con
          fondo crema, así que cada tema estrena su versión y el producto nunca
          pelea con el fondo. El cambio es puro CSS (variante `light:`): lo
          decide el data-theme que ya dejó puesto el script anti-FOUC, sin
          parpadeo al hidratar. Solo la de carbón lleva `priority` —es el LCP
          del tema por defecto y no tiene sentido precargar las dos.
          Ambas son decorativas —el mensaje lo lleva el titular—, de ahí
          `alt=""`: si llevaran texto, el lector de pantalla anunciaría las dos,
          porque `opacity:0` no las saca del árbol de accesibilidad. */}
      <motion.div
        aria-hidden
        style={{ y: fondoY }}
        className="absolute inset-0 -z-20 will-change-transform"
      >
        <motion.div
          initial={reduce ? undefined : { scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.6, ease: EASE_OUT_EXPO }}
          // El desenfoque adelgaza los bordes y el parallax descubre el borde
          // superior: el -inset da margen para que no asome ninguno, pero justo
          // el necesario — la foto es casi cuadrada y cada punto de más aquí se
          // paga recortando la composición al encajarla en un viewport apaisado.
          className="absolute -inset-y-[14%] -inset-x-[4%] blur-[6px] md:blur-[9px]"
        >
          <Img
            picture={portadaCarbon}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[50%_38%] light:opacity-0"
          />
          <Img
            picture={portadaCrema}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-[50%_38%] opacity-0 light:opacity-100"
          />
        </motion.div>
      </motion.div>

      {/* Velo que da contraste al titular y funde la foto con el resto */}
      <div aria-hidden className="hero-scrim absolute inset-0 -z-10" />

      {/* Aura Morpho — el único color vibrante, en dosis rara */}
      <div
        aria-hidden
        className="bg-morpho pointer-events-none absolute -right-[12%] top-[4%] -z-10 h-[50vh] w-[50vh] rounded-full opacity-[0.16] blur-[140px]"
      />

      <motion.div style={{ y: textoY, opacity: textoOpacity }} className="container-axis relative">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mx-auto flex max-w-4xl flex-col items-center"
        >
          <motion.span variants={item} className="eyebrow block">
            {t.hero.eyebrow}
          </motion.span>

          <motion.h1
            variants={item}
            className="font-display mt-6 text-[clamp(2.9rem,8.5vw,6rem)] leading-[0.96] font-medium text-warm-white"
          >
            <span className="block">{t.hero.titleLead}</span>
            <span className="block italic">{t.hero.titleAccent}</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-7 max-w-[52ch] text-lg text-warm-gray/90 md:text-xl"
          >
            {t.hero.subtitle}
          </motion.p>

          <motion.div
            variants={item}
            className="mt-9 flex flex-wrap items-center justify-center gap-4"
          >
            <Magnetic>
              <Link href="/tienda" className="btn-axis">
                {t.hero.ctaPrimary}
                <Icon name="arrow" size={18} />
                <MorphoSheen delay={1.2} />
              </Link>
            </Magnetic>
            <button
              onClick={() => scrollTo(document.querySelector('#shop') ? '#shop' : '#what')}
              className="btn-ghost"
            >
              {t.hero.ctaSecondary}
              <span aria-hidden>↓</span>
            </button>
          </motion.div>

          <motion.ul
            variants={item}
            className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-warm-gray/60"
          >
            {t.hero.trust.map((sig) => (
              <li key={sig} className="flex items-center gap-2">
                <span className="inline-block h-1 w-1 rounded-full bg-gold" />
                {sig}
              </li>
            ))}
          </motion.ul>
        </motion.div>
      </motion.div>

      {/* Cue de scroll */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 md:block"
      >
        <div className="h-10 w-[1px] bg-gradient-to-b from-gold/60 to-transparent" />
      </motion.div>
    </section>
  )
}
