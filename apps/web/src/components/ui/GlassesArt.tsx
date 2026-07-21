import { useId } from 'react'

type Props = {
  className?: string
  /** Intensidad del reflejo Morpho dentro de los lentes (0–1). */
  glow?: number
  strokeWidth?: number
}

/**
 * Render line-art de las gafas AXIS (placeholder premium hasta tener fotografía real).
 * Líneas doradas sobre carbón + reflejo iridiscente Morpho sutil en los lentes.
 *
 * TODO[AXIS]: sustituir por fotografía profesional de producto (ver PLAN-AXIS.md §3.2).
 */
export function GlassesArt({ className, glow = 0.16, strokeWidth = 1.6 }: Props) {
  const id = useId()
  const grad = `morpho-${id}`
  return (
    <svg
      viewBox="0 0 440 180"
      fill="none"
      className={className}
      role="img"
      aria-label="Gafas AXIS"
    >
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1A3A8A" />
          <stop offset="40%" stopColor="#2A5ADA" />
          <stop offset="74%" stopColor="#2A1A4A" />
          <stop offset="100%" stopColor="#0A0A1F" />
        </linearGradient>
      </defs>

      {/* Reflejo Morpho dentro de los lentes */}
      <g opacity={glow}>
        <rect x="44" y="58" width="150" height="74" rx="36" fill={`url(#${grad})`} />
        <rect x="246" y="58" width="150" height="74" rx="36" fill={`url(#${grad})`} />
      </g>

      <g
        stroke="#C8A96E"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Lentes */}
        <rect x="44" y="58" width="150" height="74" rx="36" />
        <rect x="246" y="58" width="150" height="74" rx="36" />
        {/* Puente */}
        <path d="M194 78q26-12 52 0" />
        {/* Cejas / barra superior */}
        <path d="M70 56q49-16 104 0M266 56q49-16 104 0" />
        {/* Bisagras / patillas */}
        <path d="M44 70 22 64q-9-2-12 6" />
        <path d="M396 70 418 64q9-2 12 6" />
        {/* Cámara (detalle) */}
        <circle cx="372" cy="70" r="3.4" fill="#C8A96E" stroke="none" />
        {/* Grabado del árbol (hint) en la patilla derecha */}
        <path d="M408 66v-6M405 62l3 2 3-2" />
      </g>
    </svg>
  )
}
