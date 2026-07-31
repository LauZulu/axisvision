import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Reveal } from './Reveal'
import { EASE_OUT_EXPO, inView } from '../../lib/motion'

type Props = {
  eyebrow: string
  title: ReactNode
  intro?: string
  align?: 'left' | 'center'
  light?: boolean
  className?: string
}

const eyebrowStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03 } },
}
const eyebrowChar = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
}

/**
 * Bloque eyebrow (DM Mono dorado) + título + intro, reutilizable en todas las
 * secciones. El eyebrow aparece letra a letra (solo opacity) y el título emerge
 * de una máscara (overflow hidden + translateY, composited). Con
 * prefers-reduced-motion todo se muestra estático.
 */
export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = 'left',
  light = false,
  className = '',
}: Props) {
  const reduce = useReducedMotion()
  const alignCls = align === 'center' ? 'text-center mx-auto items-center' : 'text-left items-start'
  // `light` = la sección de "luz" (Capabilities): color fijo, no sigue el tema.
  const titleColor = light ? 'text-[#0a0a0a]' : 'text-warm-white'
  const introColor = light ? 'text-[#0a0a0a]/70' : 'text-warm-gray/80'
  const titleCls = `font-head ${titleColor} max-w-[20ch] text-3xl leading-[1.08] font-medium tracking-[-0.01em] md:text-[2.7rem]`

  return (
    <div className={`flex flex-col ${alignCls} ${className}`}>
      {reduce ? (
        <span className="eyebrow">{eyebrow}</span>
      ) : (
        <motion.span
          className="eyebrow"
          aria-label={eyebrow}
          variants={eyebrowStagger}
          initial="hidden"
          whileInView="show"
          viewport={inView}
        >
          {Array.from(eyebrow).map((ch, i) => (
            <motion.span key={i} aria-hidden variants={eyebrowChar} className="inline-block">
              {ch === ' ' ? '\u00A0' : ch}
            </motion.span>
          ))}
        </motion.span>
      )}

      {/* Máscara editorial: el título emerge de su propia línea base.
          OJO: el `whileInView` va en la MÁSCARA, no en el <h2>. El h2 arranca
          desplazado un 105%, o sea justo fuera del recorte de su padre, y el
          IntersectionObserver intersecta contra los clips de los ancestros: su
          ratio era 0 de forma permanente, el observer no disparaba nunca y el
          título se quedaba escondido para siempre. La máscara sí se ve, así que
          disparando desde ella el h2 recibe la variante y entra. */}
      {reduce ? (
        <div className="mt-5 overflow-hidden">
          <h2 className={titleCls}>{title}</h2>
        </div>
      ) : (
        <motion.div
          className="mt-5 overflow-hidden"
          initial="hidden"
          whileInView="show"
          viewport={inView}
        >
          <motion.h2
            variants={{
              hidden: { y: '105%' },
              show: { y: '0%', transition: { duration: 0.9, ease: EASE_OUT_EXPO } },
            }}
            className={titleCls}
          >
            {title}
          </motion.h2>
        </motion.div>
      )}

      {intro && (
        <Reveal delay={0.12}>
          <p className={`${introColor} mt-5 max-w-[52ch] text-lg md:text-xl`}>{intro}</p>
        </Reveal>
      )}
    </div>
  )
}
