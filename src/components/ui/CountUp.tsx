import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

type Props = {
  value: number
  suffix?: string
  duration?: number
  className?: string
}

/** Cuenta de 0 al valor al entrar en viewport. Respeta prefers-reduced-motion. */
export function CountUp({ value, suffix = '', duration = 1.6, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    let raf = 0
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      raf = requestAnimationFrame(() => setDisplay(value))
      return () => cancelAnimationFrame(raf)
    }
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(eased * value))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, duration])

  return (
    <span ref={ref} className={className}>
      {display}
      {suffix}
    </span>
  )
}
