import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import type { Variants } from 'framer-motion'
import { fadeUp, inView, DUR_LUXE, EASE_LUXE } from '../../lib/motion'

type Props = {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'li' | 'span' | 'p' | 'article'
  delay?: number
}

/** Revela su contenido con fade + translateY al entrar en viewport (una sola vez). */
export function Reveal({ children, className, as = 'div', delay = 0 }: Props) {
  const Comp = motion[as]
  // El delay debe vivir DENTRO de la variante: la transición definida en la
  // variante tiene prioridad sobre la prop `transition` del componente.
  const variants: Variants = delay
    ? {
        hidden: fadeUp.hidden,
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: DUR_LUXE, ease: EASE_LUXE, delay },
        },
      }
    : fadeUp
  return (
    <Comp
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={inView}
    >
      {children}
    </Comp>
  )
}
