import { motion } from 'framer-motion'
import { EASE_OUT_EXPO } from '../../lib/motion'

/**
 * AXIS — Árbol filogenético (árbol de la vida).
 * Cladograma ortogonal de líneas finas doradas. El sello central de la marca.
 *
 * - `draw`: anima el dibujado del trazo al entrar en viewport (uso en el hero).
 * - sin `draw`: render estático (nav, footer, sellos).
 */

// Segmentos del cladograma, ordenados de la raíz hacia las puntas (para el stagger del dibujado).
const SEGMENTS = [
  'M50 120 V96', // tronco
  'M28 96 H72', // barra nivel 1
  'M28 96 V78', // sube izquierda
  'M72 96 V78', // sube derecha
  'M16 78 H40', // barra nivel 2 izq
  'M60 78 H84', // barra nivel 2 der
  'M16 78 V60',
  'M40 78 V60',
  'M60 78 V60',
  'M84 78 V60',
  'M10 60 H22', // barra nivel 3
  'M34 60 H46',
  'M54 60 H66',
  'M78 60 H90',
  'M10 60 V44', // puntas
  'M22 60 V44',
  'M34 60 V44',
  'M46 60 V44',
  'M54 60 V44',
  'M66 60 V44',
  'M78 60 V44',
  'M90 60 V44',
]

const NODES: Array<[number, number, number]> = [
  [50, 120, 1.8],
  [50, 96, 1.6],
  [28, 78, 1.4],
  [72, 78, 1.4],
  [16, 60, 1.3],
  [40, 60, 1.3],
  [60, 60, 1.3],
  [84, 60, 1.3],
]

const TIPS: Array<[number, number]> = [
  [10, 44], [22, 44], [34, 44], [46, 44],
  [54, 44], [66, 44], [78, 44], [90, 44],
]

type Props = {
  className?: string
  strokeWidth?: number
  draw?: boolean
  title?: string
}

export function TreeLogo({
  className,
  strokeWidth = 1.4,
  draw = false,
  title = 'AXIS',
}: Props) {
  const common = {
    viewBox: '0 0 100 124',
    role: 'img',
    'aria-label': title,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  if (!draw) {
    return (
      <svg {...common} className={className}>
        {SEGMENTS.map((d, i) => (
          <path key={i} d={d} />
        ))}
        {NODES.map(([cx, cy, r], i) => (
          <circle key={`n${i}`} cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />
        ))}
        {TIPS.map(([cx, cy], i) => (
          <circle key={`t${i}`} cx={cx} cy={cy} r={1.2} fill="currentColor" stroke="none" />
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
                pathLength: { duration: 1.1, ease: EASE_OUT_EXPO, delay: i * 0.06 },
                opacity: { duration: 0.3, delay: i * 0.06 },
              },
            },
          }}
        />
      ))}
      {[...NODES.map(([x, y, r]) => [x, y, r] as const), ...TIPS.map(([x, y]) => [x, y, 1.2] as const)].map(
        ([cx, cy, r], i) => (
          <motion.circle
            key={`c${i}`}
            cx={cx}
            cy={cy}
            r={r}
            fill="currentColor"
            stroke="none"
            variants={{
              hidden: { opacity: 0, scale: 0 },
              show: {
                opacity: 1,
                scale: 1,
                transition: { duration: 0.4, delay: 0.8 + i * 0.04, ease: EASE_OUT_EXPO },
              },
            }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
        ),
      )}
    </motion.svg>
  )
}
