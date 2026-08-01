import { canBuy as flagAllowsBuying, type StoreMode } from '../lib/storeMode'

/**
 * Modo de tienda del lado del SERVIDOR — la única versión que decide si una
 * compra se acepta.
 *
 * Son dos condiciones, no una:
 *  1. `NEXT_PUBLIC_STORE_MODE=live` (la que enciende el usuario a mano), y
 *  2. las llaves de Wompi realmente presentes en el entorno.
 *
 * El segundo cinturón importa: encender la bandera y olvidar una llave dejaría
 * un botón de comprar que lleva a un 500. Con este chequeo, la tienda se queda
 * en modo reserva hasta que TODO esté puesto, y el correo de reserva sirve para
 * avisarle después a quien quiso comprar.
 *
 * Las variables solo de servidor (`WOMPI_*`) no llevan NEXT_PUBLIC_ y nunca
 * llegan al navegador: se leen aquí, en Node.
 */

/** Variables que Wompi necesita para cobrar de verdad. */
const REQUIRED_WOMPI_VARS = [
  'NEXT_PUBLIC_WOMPI_PUBLIC_KEY',
  'WOMPI_INTEGRITY_SECRET',
  'WOMPI_EVENTS_SECRET',
  'NEXT_PUBLIC_SITE_URL',
] as const

/** Cuáles de esas variables faltan. Vacío = Wompi está listo. */
export function missingWompiVars(): string[] {
  return REQUIRED_WOMPI_VARS.filter((name) => {
    switch (name) {
      case 'NEXT_PUBLIC_WOMPI_PUBLIC_KEY':
        return !process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY
      case 'WOMPI_INTEGRITY_SECRET':
        return !process.env.WOMPI_INTEGRITY_SECRET
      case 'WOMPI_EVENTS_SECRET':
        return !process.env.WOMPI_EVENTS_SECRET
      case 'NEXT_PUBLIC_SITE_URL':
        return !process.env.NEXT_PUBLIC_SITE_URL
    }
  })
}

/** ¿Wompi está completamente configurado? */
export function isWompiConfigured(): boolean {
  return missingWompiVars().length === 0
}

/** Modo real de la tienda en el servidor. */
export function serverStoreMode(): StoreMode {
  return flagAllowsBuying() && isWompiConfigured() ? 'live' : 'preview'
}

/** ¿El servidor acepta compras ahora mismo? */
export function canCheckout(): boolean {
  return serverStoreMode() === 'live'
}

/**
 * Motivo por el que la tienda está cerrada, para el log del servidor.
 * NUNCA se le manda al navegador: enumera nombres de variables de entorno.
 */
export function previewReason(): string {
  if (!flagAllowsBuying()) return 'NEXT_PUBLIC_STORE_MODE no es "live"'
  const missing = missingWompiVars()
  return missing.length ? `faltan variables: ${missing.join(', ')}` : 'tienda abierta'
}
