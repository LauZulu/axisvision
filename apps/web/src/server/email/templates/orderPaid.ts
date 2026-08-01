import { button, eyebrow, h1, h2, lead, note, p, spacer } from '../components'
import { renderHtml, renderText } from '../layout'
import { esc, formatCop, formatDate, paymentMethodLabel, siteUrl } from '../format'
import type { EmailDoc, OrderEmailData } from '../types'
import {
  REASON_ORDER,
  greeting,
  greetingText,
  linesAsText,
  orderItems,
  orderMeta,
  shippingBlock,
} from './_shared'

/**
 * Confirmación de pago. Es el correo más importante del sistema: lo abre el
 * 100% de los compradores y es el comprobante al que vuelven después.
 *
 * Se envía SOLO desde el webhook de Wompi (APPROVED → paid), nunca al crear el
 * pedido: mientras está `pending` no hay nada que confirmar.
 */
export function renderOrderPaid(data: OrderEmailData): EmailDoc {
  const needsPrescription = data.lines.some((l) => l.prescriptionNote)

  const body = [
    eyebrow('Pedido confirmado'),
    h1('Ya son tuyas.'),
    p(`${greeting(data.customerName)} Recibimos tu pago y tu pedido quedó confirmado.`),
    lead('Una nueva forma de ver el mundo.'),
    spacer(8),
    h2('Tu pedido'),
    orderItems(data),
    orderMeta(data),
    shippingBlock(data),
    h2('Qué sigue'),
    p(
      needsPrescription
        ? 'Preparamos tu montura y coordinamos el montaje de tus lentes con la óptica aliada. Te escribimos por WhatsApp para afinar los detalles de la fórmula antes de armarlas.'
        : 'Preparamos tu pedido y, apenas salga, te enviamos el número de guía a este mismo correo.',
    ),
    button(siteUrl('/tienda'), 'Ver la tienda'),
    note(
      `Guarda la referencia <strong style="color:#d8d6cf;">${esc(data.reference)}</strong> para cualquier consulta. Tienes derecho de retracto dentro de los cinco (5) días hábiles siguientes a la entrega, conforme a la Ley 1480 de 2011.`,
    ),
  ].join('\n')

  const text = renderText({
    lines: [
      greetingText(data.customerName),
      'Recibimos tu pago y tu pedido quedó confirmado.',
      '',
      'TU PEDIDO',
      ...linesAsText(data.lines),
      `Total: ${formatCop(data.amountCop)}`,
      '',
      `Referencia: ${data.reference}`,
      `Fecha: ${formatDate(data.paidAt || data.createdAt)}`,
      ...(data.paymentMethodType ? [`Pago: ${paymentMethodLabel(data.paymentMethodType)}`] : []),
      '',
      needsPrescription
        ? 'Coordinamos por WhatsApp el montaje de tus lentes con la óptica aliada.'
        : 'Apenas salga tu pedido te enviamos el número de guía a este correo.',
      '',
      `Tienda: ${siteUrl('/tienda')}`,
    ],
    reason: REASON_ORDER,
  })

  return {
    subject: `Pago confirmado · Pedido ${data.reference}`,
    preheader: `${formatCop(data.amountCop)} · Ya estamos preparando tu pedido.`,
    html: renderHtml({ preheader: `${formatCop(data.amountCop)} · Ya estamos preparando tu pedido.`, body, reason: REASON_ORDER }),
    text,
  }
}
