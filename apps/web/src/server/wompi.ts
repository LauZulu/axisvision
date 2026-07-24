import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * Integración Wompi (Web Checkout + eventos). Reglas de la doc oficial:
 *  - Firma de integridad: SHA256(reference + amountInCents + currency
 *    [+ expirationTime] + INTEGRITY_SECRET) — SIEMPRE server-side.
 *  - Checksum de eventos: SHA256(valores de signature.properties en su orden
 *    + timestamp + EVENTS_SECRET) — propiedades extraídas DINÁMICAMENTE.
 *  - El entorno (sandbox/producción) se deriva del prefijo de la llave pública.
 */

export const WOMPI_CHECKOUT_URL = 'https://checkout.wompi.co/p/'

export function wompiPublicKey(): string {
  const k = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY
  if (!k) throw new Error('NEXT_PUBLIC_WOMPI_PUBLIC_KEY no está definido')
  return k
}

function integritySecret(): string {
  const s = process.env.WOMPI_INTEGRITY_SECRET
  if (!s) throw new Error('WOMPI_INTEGRITY_SECRET no está definido')
  return s
}

function eventsSecret(): string {
  const s = process.env.WOMPI_EVENTS_SECRET
  if (!s) throw new Error('WOMPI_EVENTS_SECRET no está definido')
  return s
}

/** API base según el entorno de la llave pública (pub_test_ → sandbox). */
export function wompiApiBase(): string {
  return wompiPublicKey().startsWith('pub_test_')
    ? 'https://sandbox.wompi.co/v1'
    : 'https://production.wompi.co/v1'
}

const sha256Hex = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex')

/**
 * Firma de integridad del checkout. Orden EXACTO de concatenación (doc):
 * reference + amountInCents + currency [+ expirationTime ISO8601] + secreto.
 */
export function integritySignature(
  reference: string,
  amountInCents: number,
  currency: string,
  expirationTime?: string,
): string {
  const base = `${reference}${amountInCents}${currency}${expirationTime ?? ''}${integritySecret()}`
  return sha256Hex(base)
}

export type WompiEvent = {
  event: string
  data: Record<string, unknown>
  sent_at?: string
  timestamp?: number
  signature?: { checksum?: string; properties?: string[] }
}

/** Lee una ruta tipo "transaction.amount_in_cents" dentro de event.data. */
function readProperty(data: Record<string, unknown>, path: string): string {
  let node: unknown = data
  for (const part of path.split('.')) {
    if (node === null || typeof node !== 'object') return ''
    node = (node as Record<string, unknown>)[part]
  }
  return node === null || node === undefined ? '' : String(node)
}

/**
 * Verifica la autenticidad de un evento de Wompi (timing-safe). Las propiedades
 * firmadas se toman del propio evento (nunca hardcodear la lista, según doc).
 */
export function verifyEventChecksum(event: WompiEvent): boolean {
  const checksum = event.signature?.checksum
  const properties = event.signature?.properties
  const timestamp = event.timestamp
  if (!checksum || !Array.isArray(properties) || timestamp === undefined) return false

  const concatenated =
    properties.map((p) => readProperty(event.data ?? {}, p)).join('') +
    String(timestamp) +
    eventsSecret()
  const expected = sha256Hex(concatenated)

  const a = Buffer.from(expected.toLowerCase(), 'utf8')
  const b = Buffer.from(String(checksum).toLowerCase(), 'utf8')
  return a.length === b.length && timingSafeEqual(a, b)
}

export type WompiTransaction = {
  id: string
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR'
  reference: string
  amount_in_cents: number
  currency: string
  payment_method_type?: string
  status_message?: string | null
  customer_email?: string | null
}

/** Consulta autoritativa de una transacción (llave pública, por entorno). */
export async function fetchTransaction(id: string): Promise<WompiTransaction | null> {
  const res = await fetch(`${wompiApiBase()}/transactions/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${wompiPublicKey()}` },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const body = (await res.json().catch(() => null)) as { data?: WompiTransaction } | null
  return body?.data ?? null
}

export type CheckoutParams = {
  checkoutUrl: string
  publicKey: string
  currency: string
  amountInCents: number
  reference: string
  signature: string
  expirationTime: string
  redirectUrl: string
}

/** Parámetros firmados para el Web Checkout (form GET a checkout.wompi.co/p/). */
export function buildCheckoutParams(reference: string, amountCop: number): CheckoutParams {
  const currency = 'COP'
  const amountInCents = amountCop * 100
  // Ventana de pago de 1 hora: una orden vieja no se paga a un precio viejo.
  const expirationTime = new Date(Date.now() + 60 * 60 * 1000).toISOString()
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')
  return {
    checkoutUrl: WOMPI_CHECKOUT_URL,
    publicKey: wompiPublicKey(),
    currency,
    amountInCents,
    reference,
    signature: integritySignature(reference, amountInCents, currency, expirationTime),
    expirationTime,
    redirectUrl: `${site}/tienda/pago/resultado`,
  }
}
