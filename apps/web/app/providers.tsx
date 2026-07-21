'use client'

import { useEffect, type ReactNode } from 'react'
import i18n from '../src/i18n'
import { SmoothScroll } from '../src/lib/SmoothScroll'

/**
 * Providers de cliente para toda la app:
 *  - Inicializa i18n (import con efecto) y aplica el idioma guardado/del navegador
 *    tras el montaje (el primer render es 'es' → sin mismatch de hidratación).
 *  - Envuelve en SmoothScroll (Lenis + ScrollContext).
 */
export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    try {
      const saved = localStorage.getItem('axis-lang')
      const lang: 'es' | 'en' =
        saved === 'es' || saved === 'en'
          ? saved
          : navigator.language?.toLowerCase().startsWith('en')
            ? 'en'
            : 'es'
      if (lang !== i18n.language) void i18n.changeLanguage(lang)
    } catch {
      /* almacenamiento no disponible — se queda en español por defecto */
    }
  }, [])

  return <SmoothScroll>{children}</SmoothScroll>
}
