import { button, dataList, eyebrow, h1, h2, note, panel, quote } from '../components'
import { renderHtml, renderText } from '../layout'
import { formatCop, formatDateTime, paymentMethodLabel } from '../format'
import type { AdminNewOrderData, EmailDoc } from '../types'
import { REASON_INTERNAL, linesAsText, orderItems, shippingBlock } from './_shared'

/**
 * Aviso interno de venta. Va al correo del equipo desde el mismo webhook que
 * confirma el pago, para no depender de que alguien tenga el panel abierto.
 *
 * Incluye los seriales de las unidades que el webhook marcó como vendidas: es
 * el dato que hace falta para ir al cajón y sacar EXACTAMENTE esa gafa, y el
 * único que no se puede reconstruir después si algo sale mal.
 */
export function renderAdminNewOrder(data: AdminNewOrderData): EmailDoc {
  const preheader = `${formatCop(data.amountCop)} · ${data.customerName}`
  const prescriptions = data.lines.filter((l) => l.prescriptionNote)

  const body = [
    eyebrow('Venta'),
    h1(`Nuevo pedido pagado · ${formatCop(data.amountCop)}`),
    panel(
      dataList([
        { label: 'Referencia', value: data.reference },
        { label: 'Cliente', value: data.customerName },
        { label: 'Correo', value: data.customerEmail },
        { label: 'Pago', value: paymentMethodLabel(data.paymentMethodType) },
        { label: 'Fecha', value: formatDateTime(data.paidAt || data.createdAt) },
      ]),
      { accent: true },
    ),
    orderItems(data),
    data.soldUnits?.length
      ? panel(dataList([{ label: 'Unidades', value: data.soldUnits.join(' · ') }]))
      : '',
    shippingBlock(data),
    prescriptions.length
      ? [
          h2('Fórmulas médicas por montar'),
          ...prescriptions.map((l) => quote(`${l.productName} — ${l.prescriptionNote}`)),
        ].join('\n')
      : '',
    button(data.adminUrl, 'Abrir en el panel'),
    note('El stock ya se recalculó desde las unidades vendidas. No lo edites a mano.'),
  ]
    .filter(Boolean)
    .join('\n')

  const text = renderText({
    lines: [
      `NUEVO PEDIDO PAGADO — ${formatCop(data.amountCop)}`,
      '',
      `Referencia: ${data.reference}`,
      `Cliente: ${data.customerName} <${data.customerEmail}>`,
      `Pago: ${paymentMethodLabel(data.paymentMethodType)}`,
      `Fecha: ${formatDateTime(data.paidAt || data.createdAt)}`,
      '',
      ...linesAsText(data.lines),
      ...(data.soldUnits?.length ? ['', `Unidades: ${data.soldUnits.join(' · ')}`] : []),
      ...(prescriptions.length
        ? ['', 'FÓRMULAS POR MONTAR', ...prescriptions.map((l) => `- ${l.productName}: ${l.prescriptionNote}`)]
        : []),
      '',
      `Panel: ${data.adminUrl}`,
    ],
    reason: REASON_INTERNAL,
    internal: true,
  })

  return {
    subject: `[AXIS] Nuevo pedido ${data.reference} · ${formatCop(data.amountCop)}`,
    preheader,
    html: renderHtml({ preheader, body, reason: REASON_INTERNAL, internal: true }),
    text,
  }
}
