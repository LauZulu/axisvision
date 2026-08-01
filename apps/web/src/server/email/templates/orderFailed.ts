import { button, eyebrow, h1, note, p, quote, spacer } from '../components'
import { renderHtml, renderText } from '../layout'
import { formatCop } from '../format'
import type { EmailDoc, OrderFailedData } from '../types'
import { REASON_ORDER, greeting, linesAsText, orderItems } from './_shared'

/**
 * Pago rechazado (webhook DECLINED → failed).
 *
 * El tono importa: el rechazo casi nunca es culpa del comprador (cupo, 3-D
 * Secure, banco), así que el correo no lo culpa ni lo alarma — solo le devuelve
 * el camino para reintentar en un clic. Y no repite el total como si fuera un
 * cobro: nadie pagó nada.
 */
export function renderOrderFailed(data: OrderFailedData): EmailDoc {
  const preheader = 'No se hizo ningún cobro. Puedes intentarlo de nuevo.'

  const body = [
    eyebrow('Pago no completado'),
    h1('No pudimos procesar tu pago.'),
    p(
      `${greeting(data.customerName)} Tu banco no autorizó el pago del pedido, así que <strong style="color:#f5f3ee;">no se hizo ningún cobro</strong>.`,
    ),
    data.reason ? quote(data.reason) : '',
    p('Suele resolverse intentando con otro medio de pago (Nequi, PSE o transferencia) o confirmando con tu banco el cupo para compras en línea.'),
    button(data.retryUrl, 'Reintentar el pago'),
    spacer(8),
    orderItems(data),
    note(
      'Tu pedido queda reservado un rato mientras lo intentas de nuevo, pero las unidades no se apartan: si se agota el modelo, te avisamos.',
    ),
  ]
    .filter(Boolean)
    .join('\n')

  const text = renderText({
    lines: [
      'No pudimos procesar tu pago.',
      'Tu banco no autorizó la transacción, así que no se hizo ningún cobro.',
      ...(data.reason ? ['', `Motivo reportado: ${data.reason}`] : []),
      '',
      'Puedes intentarlo con otro medio de pago (Nequi, PSE o transferencia):',
      data.retryUrl,
      '',
      'TU PEDIDO',
      ...linesAsText(data.lines),
      `Total: ${formatCop(data.amountCop)}`,
      '',
      `Referencia: ${data.reference}`,
    ],
    reason: REASON_ORDER,
  })

  return {
    subject: `No pudimos procesar tu pago · Pedido ${data.reference}`,
    preheader,
    html: renderHtml({ preheader, body, reason: REASON_ORDER }),
    text,
  }
}
