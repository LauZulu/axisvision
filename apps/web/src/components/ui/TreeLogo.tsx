import { motion, useTransform, type MotionValue } from 'framer-motion'
import { EASE_OUT_EXPO } from '../../lib/motion'

/**
 * AXIS — Símbolo de marca: árbol-runa dorado (tronco en Y, rama izquierda larga,
 * rama derecha con una rama interior y un chevron suelto sobre ella). El sello
 * central de la marca.
 *
 * - `draw`: anima el dibujado del trazo al entrar en viewport (uso en el hero).
 * - `progress`: dibuja el trazo en función de un MotionValue 0→1 (scroll):
 *   el avance del usuario "dibuja" la marca. Solo stroke-dashoffset — sin layout.
 * - sin ambos: render estático (nav, footer, sellos, watermark).
 *
 * GEOMETRÍA OFICIAL. Sale del vectorial original de Illustrator
 * (`CORTES OPTICA.pdf` del cliente), cuyo contorno relleno está tal cual en
 * `public/logo-axis.svg`. Aquí va como TRAZO —no como relleno— porque de ahí
 * salen las animaciones de dibujado: cada `d` es el EJE CENTRAL del trazo
 * original, calculado como bisectriz de sus dos bordes paralelos. Verificado
 * contra el relleno oficial: solo difiere en el antialiasing del borde.
 * Si tocas estos números, el logo deja de ser el del cliente.
 */

// El chevron es más fino que el árbol en el original (8.449 vs 12.19 unidades).
const CHEVRON_RATIO = 8.449 / 12.19

/** Trazos de la raíz hacia las puntas (orden = stagger del dibujado). */
const SEGMENTS: { d: string; w?: number }[] = [
  { d: 'M112.697 254.656 V115.187' }, // tronco
  { d: 'M112.697 115.187 L4.303 6.28' }, // rama izquierda (larga)
  { d: 'M112.697 115.187 L221.135 6.28' }, // rama derecha (hasta la esquina)
  { d: 'M160.155 67.534 L97.388 4.482' }, // rama interior (nace de la derecha)
  { d: 'M130.363 2.994 L158.605 31.365 L186.847 2.994', w: CHEVRON_RATIO }, // chevron suelto
]

type Props = {
  className?: string
  /** Grosor del trazo del árbol, en unidades del viewBox (ancho 225.437). */
  strokeWidth?: number
  draw?: boolean
  /** Progreso 0→1 (p. ej. scroll de la sección) que dibuja el trazo. Prima sobre `draw`. */
  progress?: MotionValue<number>
  title?: string
}

/** Un segmento dibujado por un tramo del progreso global (stagger raíz → puntas). */
function ScrollDrawnPath({
  d,
  width,
  progress,
  index,
  count,
}: {
  d: string
  width: number
  progress: MotionValue<number>
  index: number
  count: number
}) {
  // Cada trazo ocupa una ventana solapada del progreso: fluye como un dibujo a mano.
  const start = (index / count) * 0.55
  const pathLength = useTransform(progress, [start, start + 0.45], [0, 1])
  return <motion.path d={d} strokeWidth={width} style={{ pathLength }} />
}

export function TreeLogo({
  className,
  strokeWidth = 12.19,
  draw = false,
  progress,
  title = 'AXIS',
}: Props) {
  const common = {
    viewBox: '0 0 225.437 254.656',
    role: 'img',
    'aria-label': title,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    // El original tiene los extremos cortados a escuadra, no redondeados.
    strokeLinecap: 'butt' as const,
    strokeLinejoin: 'miter' as const,
  }
  const widthOf = (seg: (typeof SEGMENTS)[number]) => strokeWidth * (seg.w ?? 1)

  if (progress) {
    return (
      <svg {...common} className={className}>
        {SEGMENTS.map((seg, i) => (
          <ScrollDrawnPath
            key={i}
            d={seg.d}
            width={widthOf(seg)}
            progress={progress}
            index={i}
            count={SEGMENTS.length}
          />
        ))}
      </svg>
    )
  }

  if (!draw) {
    return (
      <svg {...common} className={className}>
        {SEGMENTS.map((seg, i) => (
          <path key={i} d={seg.d} strokeWidth={widthOf(seg)} />
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
      {SEGMENTS.map((seg, i) => (
        <motion.path
          key={i}
          d={seg.d}
          strokeWidth={widthOf(seg)}
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
