import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './src/server/auth/jwt'
import { AUTH_COOKIE } from './src/server/auth/cookies'

// Guard fail-closed del área privilegiada: /admin (páginas) y /api/admin (API)
// exigen rol admin. El resto del sitio es público. Corre en edge (jose verifica
// la firma HMAC sin tocar la DB). Si mañana hay área de cliente, se añade aquí.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get(AUTH_COOKIE)?.value
  const payload = token ? await verifyToken(token) : null
  const isAdmin = payload?.role === 'admin'

  if (pathname.startsWith('/api/admin') && !isAdmin) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Requiere sesión de administrador.' } },
      { status: 401 },
    )
  }

  const isAdminPage = pathname.startsWith('/admin') && pathname !== '/admin/login'
  if (isAdminPage && !isAdmin) {
    const url = req.nextUrl.clone()
    url.pathname = '/admin/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
