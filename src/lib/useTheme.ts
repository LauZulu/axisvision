import { useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'axis-theme'

/** Lee el tema aplicado por el script anti-FOUC de index.html (default: oscuro). */
function currentTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
}

/**
 * Tema oscuro (default) / claro, persistido en localStorage y reflejado en
 * <html data-theme>. El valor inicial ya lo fija index.html antes del render
 * para evitar parpadeo (FOUC).
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(currentTheme)

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* almacenamiento no disponible — no bloquea el cambio de tema */
    }
    // Mantiene el color de la barra del navegador en sintonía con el fondo.
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f5f3ee' : '#0a0a0a')
  }, [theme])

  const toggle = () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark'))

  return { theme, setTheme: setThemeState, toggle }
}
