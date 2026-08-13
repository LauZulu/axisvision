import { z } from 'zod'
import { requestAppointment } from '../../../src/server/appointments'
import { json, jsonError, clientIp } from '../../../src/server/http'
import { rateLimit } from '../../../src/server/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Cita para tomar la fórmula. Endpoint PÚBLICO, así que lleva las mismas tres
 * defensas que el de reservas: límite por IP, trampa para bots (`website`) y
 * validación estricta.
 */
const schema = z.object({
  // El modelo es contexto, no requisito: se puede pedir cita sin haber elegido.
  productId: z.string().uuid().optional(),
  lensOptionId: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  // El formato lo valida `normalizePhone()` dentro de `requestAppointment`, que
  // es la misma función que usa el formulario. Repetir la regla en un regex de
  // zod la dejaría desincronizada de la del cliente a la primera.
  phone: z.string().trim().min(7).max(24),
  // `''` es lo que manda el navegador cuando dejan el campo en blanco, y
  // `z.string().email()` lo rechazaría con un 400.
  email: z.union([z.string().email().max(255), z.literal('')]).optional(),
  city: z.string().trim().max(120).optional(),
  preferredTime: z.string().trim().max(200).optional(),
  note: z.string().trim().max(1000).optional(),
  locale: z.enum(['es', 'en']).optional(),
  // Honeypot: se acepta cualquier texto y se descarta abajo en silencio.
  // Rechazarlo aquí le enseñaría al bot que el campo es una trampa.
  website: z.string().max(200).optional(),
})

export async function POST(req: Request) {
  if (!rateLimit(`citas:${clientIp(req)}`, 5, 60_000)) {
    return jsonError('RATE_LIMITED', 'Demasiados intentos. Espera un minuto.', 429)
  }

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return jsonError('INVALID_BODY', 'Revisa los datos que escribiste.', 400)
  }

  // Bot detectado: se responde 201 como si todo hubiera ido bien.
  if (parsed.data.website) return json({ status: 'ok' }, 201)

  try {
    const result = await requestAppointment({
      productId: parsed.data.productId ?? null,
      lensOptionId: parsed.data.lensOptionId ?? null,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      city: parsed.data.city,
      preferredTime: parsed.data.preferredTime,
      note: parsed.data.note,
      source: 'product',
      locale: parsed.data.locale,
    })
    if (!result.ok) return jsonError(result.code, result.message, 400)
    return json({ status: 'ok' }, 201)
  } catch (err) {
    console.error('[citas] alta fallida:', err)
    return jsonError('SERVICE_UNAVAILABLE', 'No pudimos guardar tu cita. Inténtalo más tarde.', 503)
  }
}
