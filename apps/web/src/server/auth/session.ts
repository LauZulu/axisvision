import { cookies } from 'next/headers'
import type { UserRole } from '../db/entities/User'
import { verifyToken } from './jwt'
import { AUTH_COOKIE } from './cookies'

export type Session = { userId: string; email: string; role: UserRole }

/** Lee y verifica la cookie de sesión (server components / route handlers). */
export async function getSession(): Promise<Session | null> {
  const store = await cookies()
  const token = store.get(AUTH_COOKIE)?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  return { userId: payload.sub, email: payload.email, role: payload.role }
}

/** Igual que getSession pero exige rol admin (o null). */
export async function getAdminSession(): Promise<Session | null> {
  const session = await getSession()
  return session && session.role === 'admin' ? session : null
}
