import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { es } from './es'
import { en } from './en'

const STORAGE_KEY = 'axis-lang'

// Español por defecto en el render inicial (servidor y primer render de cliente
// coinciden → sin mismatch de hidratación). El idioma guardado/del navegador se
// aplica tras el montaje desde el Providers (changeLanguage).
if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    lng: 'es',
    fallbackLng: 'es',
    interpolation: { escapeValue: false },
    returnNull: false,
  })

  i18n.on('languageChanged', (lng) => {
    if (typeof document !== 'undefined') document.documentElement.lang = lng
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, lng)
  })
}

export default i18n

/** Diccionario tipado (mismo shape en es/en). Útil para acceder a objetos/arrays con tipos. */
export type Dict = typeof es
