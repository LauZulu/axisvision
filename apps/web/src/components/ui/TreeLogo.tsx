import { motion } from 'framer-motion'
import { EASE_OUT_EXPO } from '../../lib/motion'

/**
 * AXIS — Símbolo de marca: árbol-runa dorado (tronco en Y con la rama izquierda
 * larga y un doble chevron en la rama derecha). El sello central de la marca.
 *
 * - `draw`: anima el dibujado del trazo al entrar en viewport (uso en el hero).
 * - sin `draw`: render estático (nav, footer, sellos, watermark).
 *
 * Reconstrucción vectorial del logo oficial. Si se dispone del SVG original
 * exacto, puede sustituir estos trazos manteniendo el mismo viewBox.
 */

// Trazos de la raíz hacia las puntas (orden = stagger del dibujado).
const SEGMENTS = [
  'M50 98 V57', // tronco
  'M50 57 L13 21', // rama izquierda (larga)
  'M50 57 L88 12', // rama derecha (recta hasta la esquina)
  'M50 57 L64 34', // rama interior (base de los chevrones)
  'M54 16 L64 34 L77 16', // chevron exterior (punta hacia abajo)
  'M60 20 L66 31 L73 20', // chevron interior, anidado
]

type Props = {
  className?: string
  strokeWidth?: number
  draw?: boolean
  title?: string
}

export function TreeLogo({ className, strokeWidth = 4, draw = false, title = 'AXIS' }: Props) {
  const common = {
    viewBox: '0 0 100 104',
    role: 'img',
    'aria-label': title,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'miter' as const,
  }

  if (!draw) {
    return (
      <svg {...common} className={className}>
        {SEGMENTS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>
    )
  }

  return (
    <motion.svg
      {...common}
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
    >
      {SEGMENTS.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          variants={{
            hidden: { pathLength: 0, opacity: 0 },
            show: {
              pathLength: 1,
              opacity: 1,
              transition: {
                pathLength: { duration: 1.1, ease: EASE_OUT_EXPO, delay: i * 0.12 },
                opacity: { duration: 0.3, delay: i * 0.12 },
              },
            },
          }}
        />
      ))}
    </motion.svg>
  )
}
