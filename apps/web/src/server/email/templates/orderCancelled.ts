import { button, eyebrow, h1, note, p } from '../components'
import { renderHtml, renderText } from '../layout'
import { formatCop, siteUrl } from '../format'
import type { EmailDoc, OrderEmailData } from '../types'
import { REASON_ORDER, greeting, greetingText, linesAsText, orderMeta } from './_shared'

/**
 * Pedido anulado (webhook VOIDED → cancelled). El webhook ya devolvió las
 * unidades al inventario, así que aquí solo se explica el dinero: es lo único
 * que le preocupa a quien recibe esto.
 */
export function renderOrderCancelled(data: OrderEmailData): EmailDoc {
  const preheader = `Referencia ${data.reference} · Te explicamos qué pasa con el dinero.`

  const body = [
    eyebrow('Pedido anulado'),
    h1('Anulamos tu pedido.'),
    p(`${greeting(data.customerName)} Tu pedido quedó anulado y no se completó la venta.`),
    p(
      'Si el cobro alcanzó a aplicarse, la devolución se procesa automáticamente hacia el mismo medio de pago que usaste. El tiempo en que se ve reflejada depende de tu banco.',
    ),
    orderMeta(data),
    p('Si esto no fue lo que querías, escríbenos y lo retomamos: las unidades vuelven a quedar disponibles apenas se anula el pedido.'),
    button(siteUrl('/tienda'), 'Volver a la tienda'),
    note('Si no reconoces este pedido, avísanos por WhatsApp y lo revisamos contigo.'),
  ].join('\n')

  const text = renderText({
    lines: [
      greetingText(data.customerName),
      'Tu pedido quedó anulado y no se completó la venta.',
      'Si el cobro alcanzó a aplicarse, la devolución se procesa hacia el mismo medio de pago; el tiempo depende de tu banco.',
      '',
      ...linesAsText(data.lines),
      `Total: ${formatCop(data.amountCop)}`,
      `Referencia: ${data.reference}`,
      '',
      `Tienda: ${siteUrl('/tienda')}`,
    ],
    reason: REASON_ORDER,
  })

  return {
    subject: `Pedido anulado · ${data.reference}`,
    preheader,
    html: renderHtml({ preheader, body, reason: REASON_ORDER }),
    text,
  }
}
