import { formatCop } from '../../lib/products'

export { formatCop }

/**
 * Escapa TODO lo que venga de fuera (nombre del comprador, nota de la fórmula,
 * nombre del producto…) antes de interpolarlo en el HTML. Un `<` suelto en una
 * nota de fórmula rompe el correo entero.
 */
export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Escapa un valor que va dentro de un atributo `href` (y bloquea `javascript:`). */
export function escUrl(url: string): string {
  const clean = String(url ?? '').trim()
  if (/^(javascript|data|vbscript):/i.test(clean)) return '#'
  return esc(clean)
}

// Vendemos solo en Colombia: fechas y horas SIEMPRE en es-CO y hora de Bogotá,
// aunque el servidor corra en UTC. Un "entregado a las 22:00" que en realidad
// eran las 17:00 en Bogotá es un ticket de soporte.
const dateFmt = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const dateTimeFmt = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

/** "1 de agosto de 2026" */
export function formatDate(value: Date | string): string {
  return dateFmt.format(typeof value === 'string' ? new Date(value) : value)
}

/** "1 de agosto de 2026, 3:42 p. m." (hora de Bogotá) */
export function formatDateTime(value: Date | string): string {
  return dateTimeFmt.format(typeof value === 'string' ? new Date(value) : value)
}

/** URL absoluta del sitio. En correo NO sirven las rutas relativas. */
export function siteUrl(path = ''): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://axisvision.co').replace(/\/+$/, '')
  if (!path) return base
  return `${base}/${path.replace(/^\/+/, '')}`
}

/** Nombre de pila, para encabezar sin sonar a formulario. */
export function firstName(fullName: string): string {
  return (fullName || '').trim().split(/\s+/)[0] || ''
}

/** Traduce el método que reporta Wompi a algo que el comprador reconozca. */
export function paymentMethodLabel(type?: string | null): string {
  const map: Record<string, string> = {
    CARD: 'Tarjeta',
    NEQUI: 'Nequi',
    PSE: 'PSE',
    BANCOLOMBIA_TRANSFER: 'Transferencia Bancolombia',
    BANCOLOMBIA_COLLECT: 'Corresponsal Bancolombia',
    DAVIPLATA: 'Daviplata',
  }
  if (!type) return 'Pago en línea'
  return map[type] ?? type
}
