import { useRef, type PointerEvent, type ReactNode } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'

// Desplazamiento máximo del imán, en px. Sutil: se siente, no se ve venir.
const MAX_PULL = 3

const SPRING = { stiffness: 260, damping: 22, mass: 0.4 }

/**
 * Envuelve un CTA y lo "inclina" unos px hacia el cursor con física de resorte
 * (vuelve solo al salir). Solo puntero fino (se ignora touch) y respeta
 * prefers-reduced-motion. MotionValues + spring → cero re-renders de React,
 * solo transform en el compositor.
 */
export function Magnetic({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const rect = useRef<DOMRect | null>(null)
  const reduce = useReducedMotion()

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, SPRING)
  const sy = useSpring(y, SPRING)

  // El rect se cachea al entrar para no forzar layout en cada pointermove.
  const onEnter = () => {
    rect.current = ref.current?.getBoundingClientRect() ?? null
  }

  const onMove = (e: PointerEvent) => {
    if (reduce || e.pointerType !== 'mouse' || !rect.current) return
    const r = rect.current
    x.set(((e.clientX - (r.left + r.width / 2)) / (r.width / 2)) * MAX_PULL)
    y.set(((e.clientY - (r.top + r.height / 2)) / (r.height / 2)) * MAX_PULL)
  }

  const onLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.span
      ref={ref}
      onPointerEnter={onEnter}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ x: sx, y: sy }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.span>
  )
}
