/**
 * Configuración comercial de AXIS.
 *
 * ⚠️ REEMPLAZAR antes de publicar:
 *  - WHATSAPP_NUMBER: número de WhatsApp Business en formato internacional sin "+" ni espacios.
 *  - CATALOG_URL: ruta al catálogo PDF (colócalo en /public).
 *  - SALES_EMAIL / CALENDLY_URL: opcionales (respaldo de contacto).
 */

// TODO[AXIS]: poner el número real de WhatsApp Business (ej. 573001112233)
export const WHATSAPP_NUMBER = '0000000000'

// TODO[AXIS]: subir el catálogo a /public y ajustar la ruta
export const CATALOG_URL = '/catalogo-axis.pdf'

export const SALES_EMAIL = 'ventas@axis.example'
export const CALENDLY_URL = '' // opcional: link de Calendly/Cal.com

export type BuyerType = 'optica' | 'retail' | 'distribuidor' | 'b2c' | 'general'

const WA_MESSAGES: Record<BuyerType, string> = {
  optica:
    'Hola AXIS. Tengo una óptica y quiero ser punto de venta oficial. Me gustaría recibir el catálogo, los precios mayoristas y la disponibilidad de mi zona.',
  retail:
    'Hola AXIS. Represento a un retailer y me interesa distribuir AXIS. ¿Podemos hablar de condiciones, volúmenes y catálogo?',
  distribuidor:
    'Hola AXIS. Soy distribuidor y me interesa la exclusividad de territorio. Quisiera conocer el programa de distribución y los precios mayoristas.',
  b2c: 'Hola AXIS. Soy consumidor y quiero unirme a la lista de espera / saber dónde comprar.',
  general:
    'Hola AXIS. Quiero conocer cómo convertirme en punto de venta oficial y recibir el catálogo y los precios mayoristas.',
}

/** Construye un enlace wa.me con el mensaje prerellenado según el tipo de comprador. */
export function whatsappLink(type: BuyerType = 'general', custom?: string): string {
  const text = custom ?? WA_MESSAGES[type]
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}
