import { z } from 'zod'
import { subscribeToStockAlert } from '../../../src/server/waitlist'
import { json, jsonError, clientIp } from '../../../src/server/http'
import { rateLimit } from '../../../src/server/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Alta en la lista de espera. Endpoint PÚBLICO y sin sesión, así que lleva tres
 * defensas: límite por IP, trampa para bots (`website`) y validación estricta.
 *
 * `source` lo decide el cliente pero es solo informativo (sirve para saber si
 * la persona venía de un modelo agotado o de la tienda todavía cerrada); no
 * concede nada, así que mentir en ese campo no compra nada.
 */
const schema = z.object({
  productId: z.string().uuid(),
  email: z.string().email().max(255),
  source: z.enum(['sold_out', 'preview']).optional(),
  locale: z.enum(['es', 'en']).optional(),
  // Honeypot: invisible para las personas, irresistible para los bots. Acepta
  // cualquier texto a propósito — rechazarlo aquí devolvería un 400 que le
  // enseña al bot que el campo es una trampa. Se descarta más abajo, en
  // silencio y con la misma respuesta que un alta buena.
  website: z.string().max(200).optional(),
})

export async function POST(req: Request) {
  if (!rateLimit(`reservas:${clientIp(req)}`, 5, 60_000)) {
    return jsonError('RATE_LIMITED', 'Demasiados intentos. Espera un minuto.', 429)
  }

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return jsonError('INVALID_BODY', 'Revisa el correo que escribiste.', 400)
  }

  // Bot detectado: se responde 200 como si todo hubiera ido bien. Un error le
  // diría al bot que existe el honeypot y probaría otra cosa.
  if (parsed.data.website) return json({ status: 'active' }, 201)

  try {
    const result = await subscribeToStockAlert({
      productId: parsed.data.productId,
      email: parsed.data.email,
      source: parsed.data.source ?? 'sold_out',
      locale: parsed.data.locale,
    })
    if (!result.ok) return jsonError(result.code, result.message, 404)
    return json({ status: result.status }, 201)
  } catch (err) {
    console.error('[reservas] alta fallida:', err)
    return jsonError('SERVICE_UNAVAILABLE', 'No pudimos guardar tu reserva. Inténtalo más tarde.', 503)
  }
}
