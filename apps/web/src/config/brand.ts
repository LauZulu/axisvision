/**
 * Configuración comercial de AXIS.
 *
 * ⚠️ REEMPLAZAR antes de publicar:
 *  - WHATSAPP_NUMBER: número de WhatsApp Business en formato internacional sin "+" ni espacios.
 *  - CATALOG_URL: ruta al catálogo PDF (colócalo en /public).
 *  - SALES_EMAIL / CALENDLY_URL: opcionales (respaldo de contacto).
 */

// WhatsApp Business del equipo AXIS (formato internacional sin "+" ni espacios).
export const WHATSAPP_NUMBER = '573123727253'

// TODO[AXIS]: subir el catálogo a /public y ajustar la ruta
export const CATALOG_URL = '/catalogo-axis.pdf'

export const SALES_EMAIL = 'contacto@axisvision.co'
export const CALENDLY_URL = '' // opcional: link de Calendly/Cal.com

export type BuyerType = 'general'

const WA_MESSAGES: Record<BuyerType, string> = {
  general:
    'Hola AXIS. Quiero reservar mis gafas AXIS. ¿Me ayudan a elegir modelo, graduación y envío?',
}

/** Construye un enlace wa.me con el mensaje prerellenado según el tipo de comprador. */
export function whatsappLink(type: BuyerType = 'general', custom?: string): string {
  const text = custom ?? WA_MESSAGES[type]
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}
