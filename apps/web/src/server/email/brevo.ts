import type { EmailDoc } from './types'

/**
 * Cliente de Brevo (API transaccional). Un solo endpoint, sin SDK: el SDK
 * oficial arrastra dependencias para lo que aquí es un POST con una llave.
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
 */

const API_URL = 'https://api.brevo.com/v3/smtp/email'
const TIMEOUT_MS = 10_000

export type EmailRecipient = { email: string; name?: string }

export type SendResult = {
  ok: boolean
  /** No se intentó enviar porque falta configuración. No es un error. */
  skipped?: boolean
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

function sender(): { email: string; name: string } {
  return {
    email: process.env.BREVO_SENDER_EMAIL || 'no-configurado@axisvision.co',
    name: process.env.BREVO_SENDER_NAME || 'AXIS Vision',
  }
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
  tags: string[] = [],
): Promise<SendResult> {
  const recipients = Array.isArray(to) ? to : [to]
  if (recipients.length === 0) return { ok: false, skipped: true, error: 'sin destinatarios' }

  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey || !process.env.BREVO_SENDER_EMAIL) {
    // Modo sin cuenta: se deja constancia de lo que se habría enviado. Es lo que
    // permite probar el flujo completo de reservas sin Brevo configurado.
    console.info(
      `[email] sin configurar — no se envía "${doc.subject}" a ${recipients
        .map((r) => r.email)
        .join(', ')}`,
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
        sender: sender(),
        to: recipients,
        ...(replyTo ? { replyTo: { email: replyTo } } : {}),
        subject: doc.subject,
        htmlContent: doc.html,
        textContent: doc.text,
        ...(tags.length ? { tags } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
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
export async function sendToAdmin(doc: EmailDoc, tags: string[] = []): Promise<SendResult> {
  const to = adminRecipient()
  if (!to) {
    console.info(`[email] sin ADMIN_NOTIFICATION_EMAIL — no se envía "${doc.subject}"`)
    return { ok: false, skipped: true, error: 'ADMIN_NOTIFICATION_EMAIL sin definir' }
  }
  return sendEmail(to, doc, tags)
}
