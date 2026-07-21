import { SignJWT, jwtVerify } from 'jose'
import type { UserRole } from '../db/entities/User'

// JWT HS256 con la MISMA clave simétrica que firma y verifica (JWT_SECRET_MANAGMENT).
// Se usa `jose` (compatible con edge y node) para poder verificar también en el middleware.
export type JwtPayload = { sub: string; email: string; role: UserRole }

const TTL = '7d'

function secretKey(): Uint8Array {
  const s = process.env.JWT_SECRET_MANAGMENT
  if (!s) throw new Error('JWT_SECRET_MANAGMENT no está definido en el entorno')
  return new TextEncoder().encode(s)
}

/** Firma el token de sesión (7 días). */
export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(TTL)
    .sign(secretKey())
}

/** Verifica firma + expiración. Devuelve el payload o null si es inválido. */
export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey())
    const role = payload.role
    if (!payload.sub || typeof payload.email !== 'string') return null
    if (role !== 'user' && role !== 'admin') return null
    return { sub: payload.sub, email: payload.email, role }
  } catch {
    return null
  }
}
