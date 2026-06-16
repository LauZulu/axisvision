import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { es } from './es'
import { en } from './en'

const STORAGE_KEY = 'axis-lang'

function initialLang(): 'es' | 'en' {
  if (typeof window === 'undefined') return 'es'
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === 'es' || saved === 'en') return saved
  // Español por defecto (mercado primario); EN solo si el navegador es claramente inglés.
  return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'es'
}

void i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  lng: initialLang(),
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
  returnNull: false,
})

i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') document.documentElement.lang = lng
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, lng)
})

if (typeof document !== 'undefined') document.documentElement.lang = i18n.language

export default i18n

/** Diccionario tipado (mismo shape en es/en). Útil para acceder a objetos/arrays con tipos. */
export type Dict = typeof es
