import { useEffect, useRef, type ReactNode } from 'react'
import Lenis from 'lenis'
import { ScrollContext } from './scrollContext'

const NAV_OFFSET = -72

export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })
    lenisRef.current = lenis

    let raf = 0
    const loop = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  const scrollTo = (selector: string) => {
    const el = document.querySelector(selector)
    if (!el) return
    if (lenisRef.current) {
      lenisRef.current.scrollTo(el as HTMLElement, { offset: NAV_OFFSET })
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return <ScrollContext.Provider value={{ scrollTo }}>{children}</ScrollContext.Provider>
}
