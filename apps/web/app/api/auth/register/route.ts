import { z } from 'zod'
import { getDb } from '../../../../src/server/db'
import { AxisUser } from '../../../../src/server/db/entities/User'
import { hashPassword } from '../../../../src/server/auth/password'
import { signToken } from '../../../../src/server/auth/jwt'
import { emailExists, toPublicUser } from '../../../../src/server/auth/users'
import { json, jsonError, withAuthCookie, clientIp } from '../../../../src/server/http'
import { rateLimit } from '../../../../src/server/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(72),
  name: z.string().min(1).max(120).optional(),
  phone: z.string().max(40).optional(),
})

export async function POST(req: Request) {
  if (!rateLimit(`register:${clientIp(req)}`, 5, 60_000)) {
    return jsonError('RATE_LIMITED', 'Demasiados intentos. Espera un minuto.', 429)
  }

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return jsonError('INVALID_BODY', 'Datos inválidos.', 400)
  }
  const email = parsed.data.email.toLowerCase()

  try {
    if (await emailExists(email)) {
      return jsonError('EMAIL_TAKEN', 'Ese correo ya tiene una cuenta.', 409)
    }

    const db = await getDb()
    const user = await db.getRepository(AxisUser).save(
      db.getRepository(AxisUser).create({
        email,
        password: await hashPassword(parsed.data.password),
        name: parsed.data.name ?? null,
        phone: parsed.data.phone ?? null,
        role: 'user',
      }),
    )

    const token = await signToken({ sub: user.id, email: user.email, role: user.role })
    return withAuthCookie(json({ user: toPublicUser(user) }, 201), token)
  } catch {
    return jsonError('SERVICE_UNAVAILABLE', 'Servicio no disponible. Inténtalo más tarde.', 503)
  }
}
