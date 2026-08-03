import { z } from 'zod'
import type { UserRole } from '../db/entities/User'
import { verifyPassword } from './password'
import { signToken } from './jwt'
import { findByEmailWithPassword, toPublicUser } from './users'
import { json, jsonError, withAuthCookie, clientIp } from '../http'
import { rateLimit } from '../rateLimit'

const schema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(72),
})

/**
 * Login separado por rol (como los 3 endpoints del repo de referencia): valida el
 * rol ANTES de emitir token, así un `user` no entra por la puerta de admin. Error
 * genérico para no filtrar si el correo existe o el rol difiere. Rate limit 5/min/IP.
 */
export async function handleLogin(req: Request, expectedRole: UserRole) {
  if (!rateLimit(`login:${expectedRole}:${clientIp(req)}`, 5, 60_000)) {
    return jsonError('RATE_LIMITED', 'Demasiados intentos. Espera un minuto.', 429)
  }

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return jsonError('INVALID_BODY', 'Datos inválidos.', 400)
  }

  const email = parsed.data.email.toLowerCase()
  let user
  try {
    user = await findByEmailWithPassword(email)
  } catch (err) {
    console.error('[auth] no se pudo consultar el usuario:', err)
    return jsonError('SERVICE_UNAVAILABLE', 'Servicio no disponible. Inténtalo más tarde.', 503)
  }
  const passwordOk =
    user?.role === expectedRole && (await verifyPassword(parsed.data.password, user.password))

  if (!user || !passwordOk) {
    return jsonError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.', 401)
  }

  const token = await signToken({ sub: user.id, email: user.email, role: user.role })
  return withAuthCookie(json({ user: toPublicUser(user) }), token)
}
