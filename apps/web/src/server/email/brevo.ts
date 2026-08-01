import { createHash } from 'node:crypto'
import type { EmailDoc } from './types'

/**
 * Cliente de Brevo (API transaccional `POST /v3/smtp/email`). Un solo endpoint,
 * sin SDK: el SDK oficial arrastra dependencias para lo que aquí es un POST con
 * una llave.
 *
 * Reglas de este módulo, todas por la misma razón — **enviar un correo jamás
 * puede tumbar la operación que lo originó**:
 *
 *  - `sendEmail()` NUNCA lanza. Devuelve `{ ok:false }` y deja el rastro en el
 *    log. Si el webhook de Wompi reventara porque Brevo está caído, Wompi
 *    reintentaría el evento y el pedido se procesaría dos veces.
 *  - Sin `BREVO_API_KEY` no falla: registra qué habría mandado y sigue. Eso es
 *    lo que permite tener el sitio en producción con las reservas guardándose
 *    en la base ANTES de configurar la cuenta.
 *  - Timeout corto: un Brevo lento no puede alargar un request de la tienda.
 *
 * La llave vive solo aquí, en Node. `BREVO_*` no lleva prefijo `NEXT_PUBLIC_`,
 * así que Next nunca la mete en el bundle del navegador.
 */

const API_URL = 'https://api.brevo.com/v3/smtp/email'
const TIMEOUT_MS = 10_000

export type EmailRecipient = { email: string; name?: string }

/**
 * De qué "canal" sale el correo. Decide el REMITENTE, y eso no es cosmético:
 * Brevo bloquea a un contacto **por remitente**, así que quien se dé de baja de
 * un aviso de reserva dejaría de recibir también la confirmación de su pago si
 * ambos salieran del mismo buzón. Separarlos aísla ese daño.
 *
 *  - `transactional`: pedidos. Nadie debería poder darse de baja de esto.
 *  - `list`: reservas / lista de espera. Aquí la baja es legítima y esperada.
 */
export type EmailStream = 'transactional' | 'list'

export type SendOptions = {
  tags?: string[]
  stream?: EmailStream
  /**
   * Clave de idempotencia de Brevo (documentada en el objeto `headers`). Con la
   * misma clave, Brevo NO vuelve a enviar durante 30 minutos y responde
   * `duplicate_parameter`. Debe tener forma de UUID: usa `idempotencyKeyFrom()`.
   */
  idempotencyKey?: string
}

export type SendResult = {
  ok: boolean
  /** No se intentó enviar porque falta configuración. No es un error. */
  skipped?: boolean
  /** Brevo rechazó el envío por clave de idempotencia repetida. Es lo deseado. */
  duplicate?: boolean
  messageId?: string
  error?: string
}

/** ¿Hay cuenta de Brevo configurada? */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL)
}

/** Correo del equipo, destino de los avisos internos. */
export function adminRecipient(): EmailRecipient | null {
  const email = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.BREVO_REPLY_TO
  return email ? { email, name: 'Equipo AXIS' } : null
}

function sender(stream: EmailStream): { email: string; name: string } {
  const listSender = process.env.BREVO_LIST_SENDER_EMAIL
  const email =
    stream === 'list' && listSender
      ? listSender
      : process.env.BREVO_SENDER_EMAIL || 'no-configurado@axisvision.co'
  return { email, name: process.env.BREVO_SENDER_NAME || 'AXIS Vision' }
}

/**
 * Convierte cualquier identificador estable ("pedido-pagado:<id>") en un UUID
 * determinista, que es el formato que Brevo exige para `idempotencyKey`.
 *
 * Determinista a propósito: el reintento de un webhook genera la MISMA clave,
 * y por eso Brevo descarta el segundo envío. Un UUID aleatorio no serviría de
 * nada aquí. Es un UUID v5 (SHA-1 + bits de versión/variante, RFC 4122) sobre
 * un espacio de nombres propio.
 */
export function idempotencyKeyFrom(seed: string): string {
  const h = createHash('sha1').update(`axisvision:${seed}`).digest()
  const b = Buffer.from(h.subarray(0, 16))
  b[6] = (b[6] & 0x0f) | 0x50 // versión 5
  b[8] = (b[8] & 0x3f) | 0x80 // variante RFC 4122
  const hex = b.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/**
 * Envía un correo ya renderizado. No lanza nunca.
 *
 * `tags` llega a Brevo como etiquetas de la transacción: sirven para filtrar en
 * su panel ("cuántos avisos de disponibilidad se mandaron esta semana").
 */
export async function sendEmail(
  to: EmailRecipient | EmailRecipient[],
  doc: EmailDoc,
  options: SendOptions = {},
): Promise<SendResult> {
  const recipients = Array.isArray(to) ? to : [to]
  if (recipients.length === 0) return { ok: false, skipped: true, error: 'sin destinatarios' }

  const { tags = [], stream = 'transactional', idempotencyKey } = options
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey || !process.env.BREVO_SENDER_EMAIL) {
    // Modo sin cuenta: se deja constancia de lo que se habría enviado. Es lo que
    // permite probar el flujo completo de reservas sin Brevo configurado.
    console.info(
      `[email] sin configurar — no se envía "${doc.subject}" a ${recipients.length} destinatario(s)`,
    )
    return { ok: false, skipped: true, error: 'BREVO_API_KEY o BREVO_SENDER_EMAIL sin definir' }
  }

  const replyTo = process.env.BREVO_REPLY_TO

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: sender(stream),
        to: recipients,
        ...(replyTo ? { replyTo: { email: replyTo } } : {}),
        subject: doc.subject,
        htmlContent: doc.html,
        textContent: doc.text,
        ...(tags.length ? { tags } : {}),
        ...(idempotencyKey ? { headers: { idempotencyKey } } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      // Clave repetida = Brevo hizo exactamente su trabajo: no mandó el correo
      // dos veces. Es un éxito del sistema, no un fallo que haya que investigar.
      if (detail.includes('duplicate_parameter')) {
        console.info(`[email] duplicado evitado por idempotencia: "${doc.subject}"`)
        return { ok: true, duplicate: true }
      }
      console.error(`[email] Brevo respondió ${res.status}: ${detail.slice(0, 300)}`)
      return { ok: false, error: `HTTP ${res.status}` }
    }

    const data = (await res.json().catch(() => ({}))) as { messageId?: string }
    return { ok: true, messageId: data.messageId }
  } catch (err) {
    console.error('[email] fallo enviando:', err instanceof Error ? err.message : err)
    return { ok: false, error: err instanceof Error ? err.message : 'error desconocido' }
  }
}

/** Envía un aviso interno al equipo. No hace nada si no hay destino configurado. */
export async function sendToAdmin(doc: EmailDoc, options: SendOptions = {}): Promise<SendResult> {
  const to = adminRecipient()
  if (!to) {
    console.info(`[email] sin ADMIN_NOTIFICATION_EMAIL — no se envía "${doc.subject}"`)
    return { ok: false, skipped: true, error: 'ADMIN_NOTIFICATION_EMAIL sin definir' }
  }
  return sendEmail(to, doc, options)
}
