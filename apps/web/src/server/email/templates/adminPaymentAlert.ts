import { button, dataList, eyebrow, h1, note, p, panel } from '../components'
import { renderHtml, renderText } from '../layout'
import { formatCop } from '../format'
import type { AdminPaymentAlertData, EmailDoc } from '../types'
import { REASON_INTERNAL } from './_shared'

/**
 * Alerta interna: llegó un pago que NO encaja con lo que la tienda esperaba.
 *
 * Son los tres casos en los que el sistema no puede decidir solo y hay dinero
 * real de por medio. Antes se resolvían escribiendo una línea en el log, que es
 * como no resolverlos: nadie mira el log de un servidor un domingo.
 *
 *  - `double_charge`: llegó un APPROVED con un id de transacción distinto al
 *    que ya tenía el pedido. Casi siempre significa que al cliente le cobraron
 *    dos veces y hay que devolverle una.
 *  - `amount_mismatch`: el monto pagado no es el del pedido. NO se marca como
 *    pagado; hay que mirarlo a mano antes de despachar nada.
 *  - `approved_on_failed`: el pedido estaba dado por fallido y después entró el
 *    pago. Se marca pagado igual (el dinero es real), pero conviene revisarlo.
 */
export function renderAdminPaymentAlert(data: AdminPaymentAlertData): EmailDoc {
  const titles: Record<AdminPaymentAlertData['kind'], string> = {
    double_charge: 'Posible cobro duplicado',
    amount_mismatch: 'Pago con monto que no cuadra',
    approved_on_failed: 'Pago aprobado sobre un pedido fallido',
  }
  const bodies: Record<AdminPaymentAlertData['kind'], string> = {
    double_charge:
      'Llegó un pago aprobado con un id de transacción distinto al que ya tenía este pedido. Lo más probable es que al cliente le hayan cobrado dos veces: revisa el panel de Wompi y anula la transacción sobrante.',
    amount_mismatch:
      'El monto del pago no coincide con el del pedido, así que <strong style="color:#f5f3ee;">NO se marcó como pagado</strong> y no se descontó inventario. Revísalo en Wompi antes de despachar.',
    approved_on_failed:
      'Este pedido estaba marcado como fallido y después entró el pago aprobado. Se marcó como pagado y se descontó el inventario, porque el dinero es real, pero vale la pena mirar qué pasó.',
  }

  const title = titles[data.kind]
  const preheader = `${data.reference} · revisar en Wompi`

  const body = [
    eyebrow('Alerta de pago'),
    h1(title),
    p(bodies[data.kind]),
    panel(
      dataList([
        { label: 'Referencia', value: data.reference },
        { label: 'Estado', value: data.orderStatus },
        { label: 'Transacción', value: data.transactionId },
        data.storedTransactionId && data.storedTransactionId !== data.transactionId
          ? { label: 'La anterior', value: data.storedTransactionId }
          : null,
        { label: 'Esperado', value: formatCop(data.expectedCop) },
        { label: 'Recibido', value: formatCop(data.receivedCop) },
      ]),
      { accent: true },
    ),
    button(data.adminUrl, 'Abrir el pedido'),
    note('Este aviso lo genera el webhook de Wompi. No se le envió nada al cliente.'),
  ].join('\n')

  const text = renderText({
    lines: [
      title.toUpperCase(),
      '',
      `Referencia: ${data.reference}`,
      `Estado del pedido: ${data.orderStatus}`,
      `Transacción: ${data.transactionId}`,
      ...(data.storedTransactionId && data.storedTransactionId !== data.transactionId
        ? [`Transacción anterior: ${data.storedTransactionId}`]
        : []),
      `Esperado: ${formatCop(data.expectedCop)}`,
      `Recibido: ${formatCop(data.receivedCop)}`,
      '',
      `Panel: ${data.adminUrl}`,
    ],
    reason: REASON_INTERNAL,
    internal: true,
  })

  return {
    subject: `[AXIS] ⚠ ${title} · ${data.reference}`,
    preheader,
    html: renderHtml({ preheader, body, reason: REASON_INTERNAL, internal: true }),
    text,
  }
}
