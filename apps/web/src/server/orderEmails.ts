import { In } from 'typeorm'
import { getDb } from './db'
import { AxisOrder } from './db/entities/Order'
import { AxisOrderItem } from './db/entities/OrderItem'
import { AxisProductUnit } from './db/entities/ProductUnit'
import { sendEmail, sendToAdmin } from './email/brevo'
import { siteUrl } from './email/format'
import {
  renderAdminNewOrder,
  renderOrderCancelled,
  renderOrderFailed,
  renderOrderPaid,
  renderPrescriptionNextSteps,
} from './email/templates'
import type { OrderEmailData, OrderLine } from './email/types'

/**
 * Correos de un pedido. Se llaman DESPUÉS de que la transacción de base de
 * datos haya cerrado, nunca dentro: si el envío tardara o fallara con la
 * transacción abierta, dejaría filas bloqueadas y Wompi reintentaría el evento.
 *
 * Ninguna función de aquí lanza. El pedido ya está cobrado y registrado; que el
 * correo no salga es un problema menor y recuperable, tumbar el webhook no.
 */

function toLines(items: AxisOrderItem[]): OrderLine[] {
  return items.map((i) => ({
    productName: i.productName,
    quantity: i.quantity,
    unitPriceCop: i.unitPriceCop,
    lensOptionName: i.lensOptionName,
    lensExtraPriceCop: i.lensExtraPriceCop,
    prescriptionOptionName: i.prescriptionOptionName,
    prescriptionExtraPriceCop: i.prescriptionExtraPriceCop,
    prescriptionNote: i.prescriptionNote,
  }))
}

/** Aplana el `shipping` jsonb del pedido a lo que espera la plantilla. */
function toShipping(raw: Record<string, unknown> | null): OrderEmailData['shipping'] {
  if (!raw) return null
  const str = (key: string) => (typeof raw[key] === 'string' ? (raw[key] as string) : null)
  return {
    address: str('address') ?? str('direccion'),
    city: str('city') ?? str('ciudad'),
    department: str('department') ?? str('departamento'),
    notes: str('notes') ?? str('notas'),
  }
}

async function loadOrder(
  orderId: string,
): Promise<{ order: AxisOrder; items: AxisOrderItem[]; data: OrderEmailData } | null> {
  const db = await getDb()
  const order = await db.getRepository(AxisOrder).findOne({ where: { id: orderId } })
  if (!order) return null
  const items = await db.getRepository(AxisOrderItem).find({ where: { orderId } })

  return {
    order,
    items,
    data: {
      reference: order.reference,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      amountCop: order.amountCop,
      lines: toLines(items),
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      paymentMethodType: order.paymentMethodType,
      shipping: toShipping(order.shipping),
    },
  }
}

/**
 * Pago confirmado: comprobante al comprador, aviso al equipo y —si el pedido
 * lleva lentes con fórmula— el correo que explica el siguiente paso.
 */
export async function sendOrderPaidEmails(orderId: string): Promise<void> {
  try {
    const loaded = await loadOrder(orderId)
    if (!loaded) return
    const { order, items, data } = loaded

    await sendEmail(
      { email: order.customerEmail, name: order.customerName },
      renderOrderPaid(data),
      ['pedido', 'pagado'],
    )

    // Seriales de las unidades físicas que salieron con este pedido: es lo que
    // el equipo necesita para sacar EXACTAMENTE esa gafa del cajón.
    const db = await getDb()
    const units = items.length
      ? await db.getRepository(AxisProductUnit).find({
          where: { orderItemId: In(items.map((i) => i.id)) },
        })
      : []

    await sendToAdmin(
      renderAdminNewOrder({
        ...data,
        adminUrl: siteUrl('/admin/pedidos'),
        soldUnits: units.map((u) => u.code),
      }),
      ['pedido', 'interno'],
    )

    const prescriptionLines = data.lines.filter((l) => l.prescriptionNote)
    if (prescriptionLines.length > 0) {
      await sendEmail(
        { email: order.customerEmail, name: order.customerName },
        renderPrescriptionNextSteps({
          reference: order.reference,
          customerName: order.customerName,
          lines: prescriptionLines,
          uploadUrl: null,
        }),
        ['pedido', 'formula'],
      )
    }
  } catch (err) {
    console.error('[correo] fallo enviando los correos del pedido pagado:', err)
  }
}

/** Pago rechazado: se le devuelve el camino para reintentar. */
export async function sendOrderFailedEmail(orderId: string, reason?: string | null): Promise<void> {
  try {
    const loaded = await loadOrder(orderId)
    if (!loaded) return
    const { order, data } = loaded
    await sendEmail(
      { email: order.customerEmail, name: order.customerName },
      renderOrderFailed({
        ...data,
        reason: reason ?? null,
        retryUrl: siteUrl('/tienda/carrito'),
      }),
      ['pedido', 'rechazado'],
    )
  } catch (err) {
    console.error('[correo] fallo enviando el correo de pago rechazado:', err)
  }
}

/** Pedido anulado. */
export async function sendOrderCancelledEmail(orderId: string): Promise<void> {
  try {
    const loaded = await loadOrder(orderId)
    if (!loaded) return
    await sendEmail(
      { email: loaded.order.customerEmail, name: loaded.order.customerName },
      renderOrderCancelled(loaded.data),
      ['pedido', 'anulado'],
    )
  } catch (err) {
    console.error('[correo] fallo enviando el correo de anulación:', err)
  }
}
