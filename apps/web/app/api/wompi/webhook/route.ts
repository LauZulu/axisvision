import { getDb } from '../../../../src/server/db'
import { AxisOrder } from '../../../../src/server/db/entities/Order'
import { AxisOrderItem } from '../../../../src/server/db/entities/OrderItem'
import { verifyEventChecksum, type WompiEvent } from '../../../../src/server/wompi'
import { hasUnits, releaseUnits, sellUnits, syncStockFromUnits } from '../../../../src/server/inventory'
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
}

export async function POST(req: Request) {
  const event = (await req.json().catch(() => null)) as WompiEvent | null
  if (!event) return jsonError('INVALID_BODY', 'JSON inválido.', 400)

  // 1) Autenticidad: checksum válido o fuera.
  if (!verifyEventChecksum(event)) {
    return jsonError('INVALID_CHECKSUM', 'Firma del evento inválida.', 403)
  }

  // 2) Solo nos interesa transaction.updated (otros eventos → 200 y listo).
  if (event.event !== 'transaction.updated') return json({ ok: true })

  const tx = (event.data as { transaction?: TxData })?.transaction
  if (!tx?.reference || !tx.status) return json({ ok: true })

  try {
    const db = await getDb()
    const orderRepo = db.getRepository(AxisOrder)
    const order = await orderRepo.findOne({ where: { reference: tx.reference } })
    // Referencia desconocida: 200 para no provocar reintentos infinitos.
    if (!order) return json({ ok: true, unknownReference: true })

    // 3) El monto y la moneda del evento DEBEN coincidir con la orden.
    const amountOk =
      tx.amount_in_cents === order.amountCop * 100 && (tx.currency ?? 'COP') === order.currency

    switch (tx.status) {
      case 'APPROVED': {
        if (!amountOk) {
          // Pago con monto distinto al de la orden: NO se marca pagado.
          console.error(`[wompi] monto no coincide en ${order.reference}`)
          return json({ ok: true, amountMismatch: true })
        }
        // 4) Claim atómico pending→paid: si dos entregas llegan a la vez, solo
        //    una gana y descuenta stock; la otra no afecta filas y termina aquí.
        await db.transaction(async (manager) => {
          const claim = await manager
            .createQueryBuilder()
            .update(AxisOrder)
            .set({
              status: 'paid',
              wompiTransactionId: tx.id ?? null,
              paymentMethodType: tx.payment_method_type ?? null,
              paidAt: new Date(),
            })
            .where('id = :id AND status = :pending', { id: order.id, pending: 'pending' })
            .execute()

          if ((claim.affected ?? 0) === 1) {
            const items = await manager.find(AxisOrderItem, { where: { orderId: order.id } })
            for (const item of items) {
              if (!item.productId) continue
              // Con inventario por unidad se marcan unidades REALES como vendidas
              // y se deriva el stock; un `stock - n` se perdería al resincronizar.
              if (await hasUnits(manager, item.productId)) {
                const sold = await sellUnits(manager, item.productId, item.id, item.quantity)
                if (sold < item.quantity) {
                  console.error(
                    `[wompi] ${order.reference}: solo ${sold}/${item.quantity} unidades de ${item.productName}`,
                  )
                }
                await syncStockFromUnits(manager, item.productId)
              } else {
                await manager.query(
                  `UPDATE "axis_product" SET "stock" = GREATEST("stock" - $1, 0) WHERE "id" = $2`,
                  [item.quantity, item.productId],
                )
              }
            }
          }
        })
        return json({ ok: true })
      }

      case 'DECLINED':
      case 'ERROR': {
        await orderRepo.update({ id: order.id, status: 'pending' }, { status: 'failed', wompiTransactionId: tx.id ?? null })
        return json({ ok: true })
      }

      case 'VOIDED': {
        // Anulación: si estaba pagada, devolver el stock (una sola vez, claim atómico).
        await db.transaction(async (manager) => {
          const claim = await manager
            .createQueryBuilder()
            .update(AxisOrder)
            .set({ status: 'cancelled' })
            .where('id = :id AND status IN (:...from)', { id: order.id, from: ['pending', 'paid'] })
            .execute()

          if ((claim.affected ?? 0) === 1 && order.status === 'paid') {
            const items = await manager.find(AxisOrderItem, { where: { orderId: order.id } })
            for (const item of items) {
              if (!item.productId) continue
              if (await hasUnits(manager, item.productId)) {
                await releaseUnits(manager, item.id)
                await syncStockFromUnits(manager, item.productId)
              } else {
                await manager.query(
                  `UPDATE "axis_product" SET "stock" = "stock" + $1 WHERE "id" = $2`,
                  [item.quantity, item.productId],
                )
              }
            }
          }
        })
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
