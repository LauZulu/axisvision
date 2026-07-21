// Cookie de sesión: httpOnly (a prueba de XSS), Secure en prod, SameSite=Lax.
export const AUTH_COOKIE = 'axis_session'

const SEVEN_DAYS = 7 * 24 * 60 * 60

export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SEVEN_DAYS,
  }
}
