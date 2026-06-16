import { useTranslation } from 'react-i18next'
import { es } from './es'
import { en } from './en'
import type { Dict } from './index'

export type Lang = 'es' | 'en'

/**
 * Acceso tipado al diccionario del idioma activo.
 * Devuelve el objeto completo (con arrays anidados ya tipados) + utilidades de idioma.
 */
export function useDict() {
  const { i18n } = useTranslation()
  const lang: Lang = i18n.language?.toLowerCase().startsWith('en') ? 'en' : 'es'
  const t = (lang === 'en' ? en : es) as Dict
  return {
    t,
    lang,
    toggle: () => void i18n.changeLanguage(lang === 'en' ? 'es' : 'en'),
    setLang: (l: Lang) => void i18n.changeLanguage(l),
  }
}
