import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'framer-motion'

// Inclinación máxima en grados — vitrina, no gimmick.
const MAX_TILT = 6

const SPRING = { stiffness: 180, damping: 24 }

/**
 * "Vitrina de joyería" para tarjetas de producto: tilt 3D sutil que sigue el
 * cursor + reflejo especular dorado que se desplaza con él. Solo en
 * dispositivos con hover y puntero fino (en táctil renderiza los children tal
 * cual) y respeta prefers-reduced-motion. El rect se cachea en pointerenter y
 * todo se mueve por MotionValues (sin re-renders): transform + gradiente en
 * capa propia, sin layout ni paints del contenido.
 */
export function TiltCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const rect = useRef<DOMRect | null>(null)
  const reduce = useReducedMotion()
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    setEnabled(window.matchMedia('(hover: hover) and (pointer: fine)').matches)
  }, [])

  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, SPRING)
  const sry = useSpring(ry, SPRING)

  // Posición del brillo especular (en % del ancho/alto de la tarjeta).
  const gx = useMotionValue(50)
  const gy = useMotionValue(50)
  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(200, 169, 110, 0.13), transparent 55%)`

  const onEnter = () => {
    rect.current = ref.current?.getBoundingClientRect() ?? null
  }

  const onMove = (e: PointerEvent) => {
    if (!rect.current) return
    const r = rect.current
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    rx.set(-(py - 0.5) * MAX_TILT)
    ry.set((px - 0.5) * MAX_TILT)
    gx.set(px * 100)
    gy.set(py * 100)
  }

  const onLeave = () => {
    rx.set(0)
    ry.set(0)
    gx.set(50)
    gy.set(50)
  }

  if (!enabled || reduce) return <div className={className}>{children}</div>

  return (
    <motion.div
      ref={ref}
      onPointerEnter={onEnter}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      className={`relative ${className}`}
    >
      {children}
      <motion.div
        aria-hidden
        style={{ background: glare }}
        className="pointer-events-none absolute inset-0 z-10 rounded-2xl"
      />
    </motion.div>
  )
}
