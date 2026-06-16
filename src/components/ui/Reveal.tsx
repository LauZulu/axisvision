import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { fadeUp, inView } from '../../lib/motion'

type Props = {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'li' | 'span' | 'p' | 'article'
  delay?: number
}

/** Revela su contenido con fade + translateY al entrar en viewport (una sola vez). */
export function Reveal({ children, className, as = 'div', delay = 0 }: Props) {
  const Comp = motion[as]
  return (
    <Comp
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={inView}
      transition={delay ? { delay } : undefined}
    >
      {children}
    </Comp>
  )
}
