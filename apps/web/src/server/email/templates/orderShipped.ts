import { button, dataList, eyebrow, h1, h2, note, p, panel } from '../components'
import { renderHtml, renderText } from '../layout'
import type { EmailDoc, OrderShippedData } from '../types'
import { REASON_ORDER, greeting, greetingText, linesAsText, orderItems, shippingBlock } from './_shared'

/**
 * Pedido despachado. Lo dispara el admin al marcar el pedido como `shipped`
 * (ese estado ya existe en la entidad, falta el botón en el panel).
 *
 * El número de guía va en TEXTO además del botón: la mitad de la gente lo copia
 * para pegarlo en la página de la transportadora en vez de seguir el enlace.
 */
export function renderOrderShipped(data: OrderShippedData): EmailDoc {
  const preheader = `${data.carrier} · Guía ${data.trackingCode}`

  const body = [
    eyebrow('En camino'),
    h1('Tu pedido salió.'),
    p(`${greeting(data.customerName)} Tus AXIS ya están en manos de la transportadora.`),
    panel(
      dataList([
        { label: 'Transportadora', value: data.carrier },
        { label: 'Guía', value: data.trackingCode },
        data.etaLabel ? { label: 'Entrega', value: data.etaLabel } : null,
        { label: 'Pedido', value: data.reference },
      ]),
      { accent: true },
    ),
    data.trackingUrl ? button(data.trackingUrl, 'Seguir el envío') : '',
    shippingBlock(data),
    h2('Lo que va en la caja'),
    orderItems(data),
    note(
      'Si nadie puede recibir en la dirección, escríbenos por WhatsApp con la referencia del pedido y coordinamos con la transportadora.',
    ),
  ]
    .filter(Boolean)
    .join('\n')

  const text = renderText({
    lines: [
      greetingText(data.customerName),
      'Tus AXIS ya están en manos de la transportadora.',
      '',
      `Transportadora: ${data.carrier}`,
      `Guía: ${data.trackingCode}`,
      ...(data.etaLabel ? [`Entrega estimada: ${data.etaLabel}`] : []),
      ...(data.trackingUrl ? [`Seguimiento: ${data.trackingUrl}`] : []),
      `Pedido: ${data.reference}`,
      '',
      'CONTENIDO',
      ...linesAsText(data.lines),
    ],
    reason: REASON_ORDER,
  })

  return {
    subject: `Tu pedido va en camino · ${data.reference}`,
    preheader,
    html: renderHtml({ preheader, body, reason: REASON_ORDER }),
    text,
  }
}
