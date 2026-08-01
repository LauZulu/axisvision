import { NextResponse } from 'next/server'
import { unsubscribeStockAlert } from '../../../../src/server/waitlist'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Baja de la lista de espera. Es el enlace del pie de los correos de reserva.
 *
 * Un GET basta y debe bastar: exigir un formulario o una sesión para darse de
 * baja es lo que hace que la gente pulse "spam" en vez del enlace, y eso sí
 * cuesta caro en entregabilidad. El token opaco es la única autorización.
 */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token') ?? ''
  const ok = token ? await unsubscribeStockAlert(token).catch(() => false) : false
  const estado = ok ? 'baja' : 'invalida'
  return NextResponse.redirect(new URL(`/reservas/gracias?estado=${estado}`, req.url))
}
