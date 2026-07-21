import { getAdminSession, type Session } from './auth/session'
import { jsonError } from './http'
import type { NextResponse } from 'next/server'

/**
 * Guard de rol admin para handlers de API (defensa en profundidad: el middleware
 * ya bloquea /api/admin, pero re-verificamos aquí por si el matcher cambiara).
 * Devuelve `{ session }` si es admin, o `{ response }` con el 401 si no.
 */
export async function requireAdmin(): Promise<
  { session: Session; response?: never } | { session?: never; response: NextResponse }
> {
  const session = await getAdminSession()
  if (!session) {
    return { response: jsonError('UNAUTHORIZED', 'Requiere sesión de administrador.', 401) }
  }
  return { session }
}
