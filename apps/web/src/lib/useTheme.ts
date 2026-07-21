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
export function useTheme() {
  // 'dark' en el primer render (coincide con el HTML del servidor → sin mismatch).
  const [theme, setThemeState] = useState<Theme>('dark')

  // Sincroniza el estado con el data-theme real puesto por el anti-FOUC (sin escribir).
  useEffect(() => {
    setThemeState(currentTheme())
  }, [])

  const apply = (t: Theme) => {
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

  const toggle = () => apply(theme === 'dark' ? 'light' : 'dark')

  return { theme, setTheme: apply, toggle }
}
