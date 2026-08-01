import { getDb } from './db'
import { AxisOrder } from './db/entities/Order'
import { AxisOrderItem } from './db/entities/OrderItem'
import { hasUnits, sellUnits, syncStockFromUnits, type StockTransition } from './inventory'
import { handleStockTransitions } from './waitlist'
import { sendOrderPaidEmails } from './orderEmails'
import { sendToAdmin } from './email/brevo'
import { siteUrl } from './email/format'
import { renderAdminPaymentAlert } from './email/templates'

/**
 * Confirmación de un pago aprobado. **Un solo camino**, compartido por el
 * webhook de Wompi y por la página de resultado.
 *
 * Que la página de resultado también pueda confirmar no es redundancia inútil:
 * el webhook es hoy el ÚNICO camino a `paid`, y si la URL de eventos está mal
 * puesta en el panel de Wompi —o el servidor estuvo caído en los tres
 * reintentos que hace Wompi en 24 h— el cliente paga y el pedido se queda en
 * `pending` para siempre. Como toda la operación se apoya en el mismo claim
 * atómico, da igual quién llegue primero: solo uno aplica.
 */

/**
 * Guarda el id de transacción en un pedido que todavía no lo tiene.
 *
 * Se llama desde la página de resultado aunque el pago NO esté aprobado (PSE y
 * Bancolombia pasan por PENDING durante minutos). Es lo único que hace posible
 * conciliar después: Wompi **no ofrece ninguna forma de buscar una transacción
 * por nuestra referencia**, solo por su id, así que un pedido del que nunca
 * supimos el id solo se puede cuadrar a mano en su panel.
 *
 * El `WHERE ... IS NULL` evita pisar el id de un pedido ya pagado.
 */
export async function rememberTransactionId(orderId: string, transactionId: string): Promise<void> {
  if (!transactionId) return
  const db = await getDb()
  await db
    .createQueryBuilder()
    .update(AxisOrder)
    .set({ wompiTransactionId: transactionId })
    .where('id = :id AND "wompiTransactionId" IS NULL', { id: orderId })
    .execute()
}

export type PaidTransaction = {
  id: string
  amountInCents: number
  currency?: string | null
  paymentMethodType?: string | null
}

export type ConfirmOutcome =
  /** Se marcó pagado ahora (y se descontó inventario y se enviaron correos). */
  | 'applied'
  /** Ya estaba pagado con esta misma transacción. Nada que hacer. */
  | 'already'
  /** La referencia no es de esta tienda. */
  | 'unknown_reference'
  /** El monto no coincide: NO se marca pagado y se alerta al equipo. */
  | 'amount_mismatch'
  /** Llegó un pago aprobado con OTRA transacción sobre un pedido ya pagado. */
  | 'double_charge'

/** Estados desde los que un pago aprobado puede tomar el pedido. */
const CLAIMABLE = ['pending', 'failed'] as const

export async function confirmPaidOrder(
  reference: string,
  tx: PaidTransaction,
): Promise<ConfirmOutcome> {
  const db = await getDb()
  const orderRepo = db.getRepository(AxisOrder)
  const order = await orderRepo.findOne({ where: { reference } })
  if (!order) return 'unknown_reference'

  const adminUrl = siteUrl('/admin/pedidos')
  const alert = (
    kind: 'double_charge' | 'amount_mismatch' | 'approved_on_failed',
    orderStatus: string,
    storedTransactionId?: string | null,
  ) =>
    sendToAdmin(
      renderAdminPaymentAlert({
        kind,
        reference,
        orderStatus,
        transactionId: tx.id,
        storedTransactionId,
        expectedCop: order.amountCop,
        receivedCop: Math.round(tx.amountInCents / 100),
        adminUrl,
      }),
      { tags: ['pago', 'alerta'] },
    ).catch(() => undefined)

  // El monto y la moneda del evento DEBEN coincidir con los del pedido. Un pago
  // por otro valor no marca nada como pagado: se avisa y lo mira una persona.
  const amountOk =
    tx.amountInCents === order.amountCop * 100 && (tx.currency ?? 'COP') === order.currency
  if (!amountOk) {
    console.error(
      `[pago] monto no coincide en ${reference}: esperado ${order.amountCop * 100}, recibido ${tx.amountInCents}`,
    )
    await alert('amount_mismatch', order.status)
    return 'amount_mismatch'
  }

  const wasFailed = order.status === 'failed'
  let claimed = false
  const transitions = new Map<string, StockTransition>()

  await db.transaction(async (manager) => {
    // Claim atómico: si dos entregas del webhook (o el webhook y la página de
    // resultado) llegan a la vez, solo una afecta filas y descuenta inventario.
    // Se admite venir de `failed` a propósito: si el pedido se dio por perdido
    // por un rechazo anterior y luego entra el pago, el dinero es real y manda.
    const claim = await manager
      .createQueryBuilder()
      .update(AxisOrder)
      .set({
        status: 'paid',
        wompiTransactionId: tx.id,
        paymentMethodType: tx.paymentMethodType ?? null,
        paidAt: new Date(),
      })
      .where('id = :id AND status IN (:...from)', { id: order.id, from: [...CLAIMABLE] })
      .execute()

    if ((claim.affected ?? 0) !== 1) return
    claimed = true

    const items = await manager.find(AxisOrderItem, { where: { orderId: order.id } })
    for (const item of items) {
      if (!item.productId) continue
      // Con inventario por unidad se marcan unidades REALES como vendidas y se
      // deriva el stock; un `stock - n` se perdería al resincronizar.
      if (await hasUnits(manager, item.productId)) {
        const sold = await sellUnits(manager, item.productId, item.id, item.quantity)
        if (sold < item.quantity) {
          console.error(
            `[pago] ${reference}: solo ${sold}/${item.quantity} unidades de ${item.productName}`,
          )
        }
        for (const [id, t] of await syncStockFromUnits(manager, item.productId)) {
          transitions.set(id, t)
        }
      } else {
        await manager.query(
          `UPDATE "axis_product" SET "stock" = GREATEST("stock" - $1, 0) WHERE "id" = $2`,
          [item.quantity, item.productId],
        )
      }
    }
  })

  if (claimed) {
    // Fuera de la transacción: los correos y el aviso de stock no pueden
    // alargarla ni tumbarla (las dos llamadas tragan sus errores).
    await sendOrderPaidEmails(order.id)
    await handleStockTransitions(transitions)
    if (wasFailed) await alert('approved_on_failed', 'paid', order.wompiTransactionId)
    return 'applied'
  }

  // No se pudo tomar el pedido. Si ya estaba pagado con ESTA transacción, es
  // simplemente una entrega repetida del mismo evento: todo en orden.
  const fresh = await orderRepo.findOne({ where: { id: order.id } })
  if (fresh?.status === 'paid' && fresh.wompiTransactionId && fresh.wompiTransactionId !== tx.id) {
    // Dos transacciones aprobadas distintas para el mismo pedido: al cliente le
    // cobraron dos veces. El sistema no puede devolver dinero solo — avisa.
    console.error(
      `[pago] posible cobro duplicado en ${reference}: ${fresh.wompiTransactionId} y ${tx.id}`,
    )
    await alert('double_charge', fresh.status, fresh.wompiTransactionId)
    return 'double_charge'
  }
  return 'already'
}
