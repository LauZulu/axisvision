import { button, dataList, eyebrow, h1, note, p, panel } from '../components'
import { renderHtml, renderText } from '../layout'
import { esc } from '../format'
import type { AdminAppointmentData, EmailDoc } from '../types'
import { REASON_INTERNAL } from './_shared'

/**
 * Aviso interno: alguien pidió cita para tomarse la fórmula.
 *
 * Es el correo más urgente de los internos y por eso lleva el WhatsApp en el
 * botón, no en una tabla: quien lo abre no tiene que buscar nada ni entrar al
 * panel, pulsa y escribe. Una cita sin contestar en el día es una venta que se
 * enfría — la persona ya dijo qué modelo quería.
 */
export function renderAdminAppointment(data: AdminAppointmentData): EmailDoc {
  const preheader = `${data.name} · ${data.phoneDisplay}${
    data.productName ? ` · ${data.productName}` : ''
  }`

  const body = [
    eyebrow('Cita'),
    h1('Quieren que les tomemos la fórmula'),
    panel(
      dataList([
        { label: 'Nombre', value: data.name },
        { label: 'WhatsApp', value: data.phoneDisplay },
        { label: 'Modelo', value: data.productName ?? 'Todavía no eligió' },
        { label: 'Lente', value: data.lensName ?? '—' },
        { label: 'Ciudad', value: data.city ?? '—' },
        { label: 'Cuándo puede', value: data.preferredTime ?? '—' },
      ]),
      { accent: true },
    ),
    data.note ? p(`Nota: ${esc(data.note)}`) : '',
    button(data.whatsappUrl, 'Escribirle por WhatsApp'),
    note(
      'Sin fórmula no se puede cerrar la compra: hasta que se la tomen, esa persona no tiene forma de terminar el pedido en la tienda.',
    ),
  ]
    .filter(Boolean)
    .join('\n')

  const text = renderText({
    lines: [
      'NUEVA CITA PARA TOMAR FÓRMULA',
      `Nombre: ${data.name}`,
      `WhatsApp: ${data.phoneDisplay}`,
      `Modelo: ${data.productName ?? 'todavía no eligió'}`,
      `Lente: ${data.lensName ?? '—'}`,
      `Ciudad: ${data.city ?? '—'}`,
      `Cuándo puede: ${data.preferredTime ?? '—'}`,
      data.note ? `Nota: ${data.note}` : '',
      '',
      `Escribirle: ${data.whatsappUrl}`,
      `Panel: ${data.adminUrl}`,
    ].filter(Boolean),
    reason: REASON_INTERNAL,
    internal: true,
  })

  return {
    subject: `[AXIS] Cita para fórmula — ${data.name}`,
    preheader,
    html: renderHtml({ preheader, body, reason: REASON_INTERNAL, internal: true }),
    text,
  }
}
