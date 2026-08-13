/**
 * Normalización de teléfonos — compartida entre cliente y servidor.
 *
 * Sin imports de servidor a propósito: el formulario de reserva valida con la
 * MISMA función con la que el servidor guarda, así que lo que el navegador da
 * por bueno es exactamente lo que entra en la DB (y al revés). Duplicar la
 * regla en dos sitios acaba siempre en un campo que el front acepta y el back
 * rechaza.
 *
 * Se guarda SIEMPRE la forma canónica (solo dígitos, con indicativo y sin '+'),
 * porque es la identidad de una reserva sin correo y porque es lo que pide
 * `wa.me`. Guardar lo que la persona tecleó dejaría "312 372 7253",
 * "+57 3123727253" y "3123727253" como tres personas distintas.
 */

/** Colombia. Único país al que vendemos hoy. */
const DEFAULT_COUNTRY = '57'

/**
 * Devuelve el teléfono en forma canónica (`573123727253`) o `null` si no sirve.
 *
 * Acepta lo que la gente escribe de verdad: con espacios, guiones, paréntesis,
 * con o sin `+57`, y también un número internacional si alguien compra desde
 * fuera. Un número local de 10 dígitos se asume colombiano.
 */
export function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const hasPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return null

  // Internacional explícito: se respeta el indicativo que haya escrito.
  if (hasPlus) return digits.length >= 8 && digits.length <= 15 ? digits : null

  // Móvil o fijo colombiano tal cual se marca dentro del país.
  if (digits.length === 10) return DEFAULT_COUNTRY + digits

  // Ya venía con indicativo pero sin '+' (573123727253).
  if (digits.length === 12 && digits.startsWith(DEFAULT_COUNTRY)) return digits

  return null
}

/** `573123727253` → `+57 312 372 7253`. Solo para mostrar, nunca para guardar. */
export function formatPhone(canonical: string): string {
  if (canonical.length === 12 && canonical.startsWith(DEFAULT_COUNTRY)) {
    const n = canonical.slice(2)
    return `+57 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`
  }
  return `+${canonical}`
}

/** Enlace de WhatsApp a un número ya normalizado, con mensaje opcional. */
export function whatsappTo(canonical: string, message?: string): string {
  const base = `https://wa.me/${canonical}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
