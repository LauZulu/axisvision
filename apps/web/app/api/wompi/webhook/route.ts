import { getDb } from '../../../../src/server/db'
import { AxisOrder } from '../../../../src/server/db/entities/Order'
import { AxisOrderItem } from '../../../../src/server/db/entities/OrderItem'
import { isSameEnvironment, verifyEventChecksum, type WompiEvent } from '../../../../src/server/wompi'
import {
  hasUnits,
  releaseUnits,
  syncStockFromUnits,
  type StockTransition,
} from '../../../../src/server/inventory'
import { handleStockTransitions } from '../../../../src/server/waitlist'
import {
  sendOrderCancelledEmail,
  sendOrderFailedEmail,
} from '../../../../src/server/orderEmails'
import { confirmPaidOrder } from '../../../../src/server/payments'
import { json, jsonError } from '../../../../src/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Webhook de Wompi (transaction.updated). Público, pero CADA evento se autentica
// verificando el checksum (SHA256 con WOMPI_EVENTS_SECRET, timing-safe) ANTES de
// procesar. Idempotente: los reintentos de Wompi (30min/3h/24h) no duplican nada.

type TxData = {
  id?: string
  status?: string
  reference?: string
  amount_in_cents?: number
  currency?: string
  payment_method_type?: string
  /** Motivo del rechazo que reporta la pasarela; se le reenvía al comprador. */
  status_message?: string
}

export async function POST(req: Request) {
  const event = (await req.json().catch(() => null)) as WompiEvent | null
  if (!event) return jsonError('INVALID_BODY', 'JSON inválido.', 400)

  // 1) Autenticidad: checksum válido o fuera.
  if (!verifyEventChecksum(event)) {
    return jsonError('INVALID_CHECKSUM', 'Firma del evento inválida.', 403)
  }

  // 2) El evento tiene que ser del mismo entorno que las llaves de la tienda.
  //    200 y a otra cosa: no es un ataque, es una configuración cruzada.
  if (!isSameEnvironment(event)) {
    console.warn(`[wompi] evento de entorno "${event.environment}" descartado`)
    return json({ ok: true, wrongEnvironment: true })
  }

  // 3) Solo nos interesa transaction.updated (otros eventos → 200 y listo).
  if (event.event !== 'transaction.updated') return json({ ok: true })

  const tx = (event.data as { transaction?: TxData })?.transaction
  if (!tx?.reference || !tx.status) return json({ ok: true })

  try {
    const db = await getDb()
    const orderRepo = db.getRepository(AxisOrder)
    const order = await orderRepo.findOne({ where: { reference: tx.reference } })
    // Referencia desconocida: 200 para no provocar reintentos infinitos.
    if (!order) return json({ ok: true, unknownReference: true })

    switch (tx.status) {
      case 'APPROVED': {
        // Toda la lógica (validar monto, claim atómico, inventario, correos,
        // alertas) vive en confirmPaidOrder: la comparte con la página de
        // resultado, así los dos caminos no pueden divergir.
        const outcome = await confirmPaidOrder(order.reference, {
          id: tx.id ?? '',
          amountInCents: tx.amount_in_cents ?? 0,
          currency: tx.currency,
          paymentMethodType: tx.payment_method_type,
        })
        return json({ ok: true, outcome })
      }

      case 'DECLINED':
      case 'ERROR': {
        const failed = await orderRepo.update(
          { id: order.id, status: 'pending' },
          { status: 'failed', wompiTransactionId: tx.id ?? null },
        )
        if ((failed.affected ?? 0) === 1) {
          await sendOrderFailedEmail(order.id, tx.status_message)
        }
        return json({ ok: true })
      }

      case 'VOIDED': {
        // Anulación: si estaba pagada, devolver el stock (una sola vez, claim atómico).
        // Devolver unidades puede sacar al modelo del 0 → hay lista que avisar.
        let cancelled = false
        const transitions = new Map<string, StockTransition>()
        await db.transaction(async (manager) => {
          const claim = await manager
            .createQueryBuilder()
            .update(AxisOrder)
            .set({ status: 'cancelled' })
            .where('id = :id AND status IN (:...from)', { id: order.id, from: ['pending', 'paid'] })
            .execute()

          if ((claim.affected ?? 0) === 1) cancelled = true
          if ((claim.affected ?? 0) === 1 && order.status === 'paid') {
            const items = await manager.find(AxisOrderItem, { where: { orderId: order.id } })
            for (const item of items) {
              if (!item.productId) continue
              if (await hasUnits(manager, item.productId)) {
                await releaseUnits(manager, item.id)
                for (const [id, t] of await syncStockFromUnits(manager, item.productId)) {
                  transitions.set(id, t)
                }
              } else {
                await manager.query(
                  `UPDATE "axis_product" SET "stock" = "stock" + $1 WHERE "id" = $2`,
                  [item.quantity, item.productId],
                )
              }
            }
          }
        })

        if (cancelled) {
          await sendOrderCancelledEmail(order.id)
          await handleStockTransitions(transitions)
        }
        return json({ ok: true })
      }

      default:
        // PENDING u otros estados intermedios: nada que hacer.
        return json({ ok: true })
    }
  } catch (err) {
    // Error nuestro (DB caída, etc.): 500 para que Wompi REINTENTE más tarde.
    console.error('[wompi] webhook error:', err instanceof Error ? err.message : err)
    return jsonError('INTERNAL', 'Error procesando el evento.', 500)
  }
}
