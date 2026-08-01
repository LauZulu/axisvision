import { NextResponse } from 'next/server'
import { unsubscribeStockAlert } from '../../../../src/server/waitlist'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Baja de la lista de espera.
 *
 * **El GET no da de baja a nadie**, y esto es deliberado: los antivirus de
 * correo y los escáneres corporativos (Outlook Safe Links, Gmail, proxies de
 * empresa) ABREN todos los enlaces de un mensaje para comprobar que no son
 * maliciosos. Si la baja se ejecutara al cargar la URL, esos escáneres darían
 * de baja en silencio a gente que nunca pulsó nada, y ni ellos ni nosotros nos
 * enteraríamos. El GET solo lleva a una página con un botón.
 *
 * El POST es el que ejecuta. Un escáner no envía formularios, una persona sí.
 * Es además la forma que exige la baja en un clic de los clientes de correo
 * (RFC 8058), por si más adelante se añade la cabecera `List-Unsubscribe-Post`.
 *
 * El token opaco sigue siendo la única autorización: no hace falta sesión.
 */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token') ?? ''
  return NextResponse.redirect(
    new URL(`/reservas/baja?token=${encodeURIComponent(token)}`, req.url),
  )
}

export async function POST(req: Request) {
  const url = new URL(req.url)
  let token = url.searchParams.get('token') ?? ''

  // El formulario de la página manda el token en el cuerpo; la baja en un clic
  // de los clientes de correo lo trae en la URL. Se aceptan las dos formas.
  if (!token) {
    const form = await req.formData().catch(() => null)
    token = typeof form?.get('token') === 'string' ? (form.get('token') as string) : ''
  }

  const ok = token ? await unsubscribeStockAlert(token).catch(() => false) : false
  // 303: convierte el POST en un GET al redirigir, así recargar la página de
  // destino no reenvía el formulario.
  return NextResponse.redirect(
    new URL(`/reservas/gracias?estado=${ok ? 'baja' : 'invalida'}`, req.url),
    303,
  )
}
