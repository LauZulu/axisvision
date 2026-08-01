import { NextResponse } from 'next/server'
import { verifyStockAlert } from '../../../../src/server/waitlist'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Confirmación del correo (doble opt-in). Se llega aquí desde el enlace del
 * correo, así que la respuesta NO es JSON: es una redirección a una página que
 * la persona pueda leer.
 */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token') ?? ''
  const ok = token ? await verifyStockAlert(token).catch(() => false) : false
  const estado = ok ? 'confirmada' : 'invalida'
  return NextResponse.redirect(new URL(`/reservas/gracias?estado=${estado}`, req.url))
}
