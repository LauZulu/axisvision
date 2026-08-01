import { button, eyebrow, h1, note, p, panel } from '../components'
import { renderHtml, renderText } from '../layout'
import { EMAIL, FONT } from '../theme'
import { formatCop } from '../format'
import type { CheckoutAbandonedData, EmailDoc } from '../types'
import { REASON_ORDER, greeting, greetingText, linesAsText, orderItems } from './_shared'

/**
 * Recordatorio de compra sin terminar: pedido que lleva más de una hora en
 * `pending` (justo el `expiration-time` que se le firma a Wompi) y nunca llegó
 * un webhook de aprobación.
 *
 * Va UNA sola vez. Un segundo recordatorio a alguien que decidió no comprar es
 * la forma más rápida de que marque el remitente como spam, y con dominio
 * propio esa marca se paga en entregabilidad de los correos que sí importan.
 */
export function renderCheckoutAbandoned(data: CheckoutAbandonedData): EmailDoc {
  const preheader = 'Tu pedido sigue armado. Solo falta el pago.'
  const scarcity =
    data.unitsLeft != null && data.unitsLeft > 0 && data.unitsLeft <= 3
      ? panel(
          `<p style="margin:0;font-family:${FONT.body};font-size:15px;line-height:1.6;color:${EMAIL.warmGray};">Quedan <strong style="color:${EMAIL.warmWhite};">${data.unitsLeft} ${
            data.unitsLeft === 1 ? 'unidad' : 'unidades'
          }</strong> de lo que elegiste. Cada AXIS es una unidad física del inventario: cuando se va, se va.</p>`,
          { accent: true },
        )
      : ''

  const body = [
    eyebrow('Compra sin terminar'),
    h1('Quedó a un paso.'),
    p(
      `${greeting(data.customerName)} No alcanzamos a recibir el pago de tu pedido, así que lo dejamos armado tal como lo tenías.`,
    ),
    orderItems(data),
    scarcity,
    button(data.resumeUrl, 'Terminar mi compra'),
    note(
      'Si cambiaste de opinión, ignora este correo: no volveremos a escribirte por este pedido.',
    ),
  ]
    .filter(Boolean)
    .join('\n')

  const text = renderText({
    lines: [
      greetingText(data.customerName),
      'No alcanzamos a recibir el pago de tu pedido, así que lo dejamos armado tal como lo tenías.',
      '',
      ...linesAsText(data.lines),
      `Total: ${formatCop(data.amountCop)}`,
      ...(data.unitsLeft != null && data.unitsLeft > 0 && data.unitsLeft <= 3
        ? ['', `Quedan ${data.unitsLeft} unidades de lo que elegiste.`]
        : []),
      '',
      `Terminar la compra: ${data.resumeUrl}`,
      '',
      'Si cambiaste de opinión, ignora este correo: no volveremos a escribirte por este pedido.',
    ],
    reason: REASON_ORDER,
  })

  return {
    subject: 'Tu pedido quedó a un paso',
    preheader,
    html: renderHtml({ preheader, body, reason: REASON_ORDER }),
    text,
  }
}
