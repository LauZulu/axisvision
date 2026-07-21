import { NextResponse } from 'next/server'
import { AUTH_COOKIE, authCookieOptions } from './auth/cookies'

/** Respuesta JSON tipada. */
export function json<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}

/** Error JSON con forma estable `{ error: { code, message } }`. */
export function jsonError(code: string, message: string, status: number): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status })
}

/** Adjunta la cookie de sesión a una respuesta. */
export function withAuthCookie(res: NextResponse, token: string): NextResponse {
  res.cookies.set(AUTH_COOKIE, token, authCookieOptions())
  return res
}

/** Borra la cookie de sesión. */
export function clearAuthCookie(res: NextResponse): NextResponse {
  res.cookies.set(AUTH_COOKIE, '', { ...authCookieOptions(), maxAge: 0 })
  return res
}

/** IP del request para rate limiting (respeta proxies). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}
