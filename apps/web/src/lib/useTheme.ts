import { useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'axis-theme'

/** Lee el tema aplicado por el script anti-FOUC del layout (default: oscuro). */
function currentTheme(): Theme {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
}

/**
 * Tema oscuro (default) / claro, persistido en localStorage y reflejado en
 * <html data-theme>. El valor inicial lo fija el script anti-FOUC del layout
 * antes de la hidratación; aquí NO se escribe en el montaje (solo se sincroniza
 * el estado) para no revertir el tema de los usuarios en claro.
 */
/** Punto del clic desde el que nace el revelado circular. */
type ClickPoint = { clientX: number; clientY: number }

type DocWithVT = Document & {
  startViewTransition?: (update: () => void) => { ready: Promise<void> }
}

export function useTheme() {
  // 'dark' en el primer render (coincide con el HTML del servidor → sin mismatch).
  const [theme, setThemeState] = useState<Theme>('dark')

  // Sincroniza el estado con el data-theme real puesto por el anti-FOUC (sin escribir).
  useEffect(() => {
    setThemeState(currentTheme())
  }, [])

  const commit = (t: Theme) => {
    setThemeState(t)
    const root = document.documentElement
    root.setAttribute('data-theme', t)
    try {
      localStorage.setItem(STORAGE_KEY, t)
    } catch {
      /* almacenamiento no disponible — no bloquea el cambio de tema */
    }
    // Mantiene el color de la barra del navegador en sintonía con el fondo.
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', t === 'light' ? '#f5f3ee' : '#0a0a0a')
  }

  /**
   * Aplica el tema con un revelado circular (View Transitions API) que nace en
   * el punto del clic. Fallback: cambio instantáneo si el navegador no soporta
   * la API o el usuario prefiere menos movimiento. Anima solo el clip-path del
   * snapshot — sin repaints por elemento ni layout shifts.
   */
  const apply = (t: Theme, ev?: ClickPoint) => {
    const doc = document as DocWithVT
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!doc.startViewTransition || reduce) {
      commit(t)
      return
    }

    const x = ev?.clientX ?? window.innerWidth / 2
    const y = ev?.clientY ?? 0
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    )

    doc
      .startViewTransition(() => commit(t))
      .ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
          },
          {
            duration: 650,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            pseudoElement: '::view-transition-new(root)',
          },
        )
      })
      .catch(() => {
        /* la transición es decorativa: si falla, el tema ya quedó aplicado */
      })
  }

  const toggle = (ev?: ClickPoint) => apply(theme === 'dark' ? 'light' : 'dark', ev)

  return { theme, setTheme: apply, toggle }
}
