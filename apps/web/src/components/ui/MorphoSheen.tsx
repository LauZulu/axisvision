import { motion, useReducedMotion } from 'framer-motion'
import { EASE_OUT_EXPO } from '../../lib/motion'

/**
 * Destello iridiscente Morpho que cruza su contenedor UNA sola vez al entrar
 * en viewport. Pensado para vivir dentro de un `.btn-axis` (que ya es
 * `position: relative` + `overflow: hidden`). Uso reservado a los momentos de
 * compra (regla de marca: Morpho raro = magia). Solo anima transform/opacity.
 */
export function MorphoSheen({ delay = 0.5 }: { delay?: number }) {
  const reduce = useReducedMotion()
  if (reduce) return null
  return (
    <motion.span
      aria-hidden
      initial={{ x: '-160%', opacity: 0 }}
      whileInView={{ x: '160%', opacity: [0, 0.5, 0] }}
      viewport={{ once: true, amount: 0.9 }}
      transition={{ duration: 1.4, ease: EASE_OUT_EXPO, delay }}
      className="bg-morpho pointer-events-none absolute inset-y-0 left-0 w-2/3 -skew-x-12 blur-md mix-blend-screen"
    />
  )
}
