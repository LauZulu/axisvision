/**
 * Piezas que comparten varias plantillas. Todo lo que se repita entre correos
 * de pedido vive aquí para que un cambio de formato no haya que hacerlo siete
 * veces (y para que el correo de "enviado" no diga los totales distinto al de
 * "confirmado").
 */
import { dataList, itemsTable, panel } from '../components'
import { esc, formatCop, formatDate, paymentMethodLabel } from '../format'
import type { OrderEmailData, OrderLine } from '../types'

export const REASON_ORDER =
  'Recibiste este correo porque hiciste un pedido en axisvision.co. Es un mensaje transaccional, no publicidad.'
export const REASON_WAITLIST =
  'Recibiste este correo porque pediste que te avisáramos cuando este modelo volviera a estar disponible.'
export const REASON_INTERNAL = 'Correo interno del panel de AXIS. No lo reenvíes.'

/** Bloque de datos del pedido (referencia, fecha, método de pago). */
export function orderMeta(data: OrderEmailData): string {
  return panel(
    dataList([
      { label: 'Referencia', value: data.reference },
      { label: 'Fecha', value: formatDate(data.paidAt || data.createdAt) },
      data.paymentMethodType
        ? { label: 'Pago', value: paymentMethodLabel(data.paymentMethodType) }
        : null,
      { label: 'Total', value: formatCop(data.amountCop) },
    ]),
  )
}

/** Resumen de líneas + total. */
export function orderItems(data: OrderEmailData): string {
  return itemsTable(data.lines, data.amountCop)
}

/** Dirección de envío, si el pedido la trae. */
export function shippingBlock(data: OrderEmailData): string {
  const s = data.shipping
  if (!s || (!s.address && !s.city)) return ''
  const parts = [s.address, [s.city, s.department].filter(Boolean).join(', ')].filter(Boolean)
  return panel(
    dataList([
      { label: 'Envío a', value: parts.join(' — ') },
      s.notes ? { label: 'Notas', value: s.notes } : null,
    ]),
  )
}

/** Las mismas líneas, en texto plano. */
export function linesAsText(lines: OrderLine[]): string[] {
  return lines.map((l) => {
    const lens = l.lensOptionName
      ? ` [lente: ${l.lensOptionName}${l.lensExtraPriceCop ? ` +${formatCop(l.lensExtraPriceCop)}` : ''}]`
      : ''
    return `- ${l.productName}${l.quantity > 1 ? ` x${l.quantity}` : ''}${lens} — ${formatCop(
      l.unitPriceCop * l.quantity,
    )}`
  })
}

/** Saludo con el nombre de pila ya escapado (para el HTML). */
export function greeting(name: string): string {
  const first = (name || '').trim().split(/\s+/)[0]
  return first ? `Hola, ${esc(first)}.` : 'Hola.'
}

/** El mismo saludo sin escapar, para la versión en texto plano. */
export function greetingText(name: string): string {
  const first = (name || '').trim().split(/\s+/)[0]
  return first ? `Hola, ${first}.` : 'Hola.'
}
