import { randomUUID } from 'node:crypto'
import { In } from 'typeorm'
import { getDb } from './db'
import { AxisProduct } from './db/entities/Product'
import { AxisOrder } from './db/entities/Order'
import { AxisOrderItem } from './db/entities/OrderItem'

export type CheckoutItemInput = { productId: string; quantity: number }

export type CheckoutInput = {
  customer: { name: string; email: string; phone?: string }
  shipping?: Record<string, unknown>
  items: CheckoutItemInput[]
}

export type CheckoutResult = {
  reference: string
  orderId: string
  amountCop: number
  currency: string
  status: string
}

export type CheckoutError = { ok: false; code: string; message: string }

function reference(): string {
  return `AXIS-${randomUUID().split('-')[0].toUpperCase()}`
}

/**
 * Crea una orden de INVITADO (sin cuenta): valida productos activos y stock,
 * congela nombre y precio en las líneas, y guarda la orden como `pending`.
 * NO descuenta stock aquí — eso ocurrirá al confirmar el pago (Wompi, Fase 7).
 * Devuelve la referencia y el monto, listos para iniciar la pasarela.
 */
export async function createGuestOrder(
  input: CheckoutInput,
): Promise<{ ok: true; order: CheckoutResult } | CheckoutError> {
  const db = await getDb()
  const ids = [...new Set(input.items.map((i) => i.productId))]
  const products = await db.getRepository(AxisProduct).findBy({ id: In(ids) })
  const byId = new Map(products.map((p) => [p.id, p]))

  const lines: { product: AxisProduct; quantity: number }[] = []
  for (const item of input.items) {
    const product = byId.get(item.productId)
    if (!product || !product.active) {
      return { ok: false, code: 'PRODUCT_UNAVAILABLE', message: `Producto no disponible: ${item.productId}` }
    }
    if (product.stock < item.quantity) {
      return { ok: false, code: 'INSUFFICIENT_STOCK', message: `Sin stock suficiente de ${product.name}` }
    }
    lines.push({ product, quantity: item.quantity })
  }

  const amountCop = lines.reduce((sum, l) => sum + l.product.priceCop * l.quantity, 0)

  // Transacción: crea orden + líneas de forma atómica.
  const order = await db.transaction(async (manager) => {
    const created = manager.create(AxisOrder, {
      reference: reference(),
      userId: null,
      customerName: input.customer.name,
      customerEmail: input.customer.email.toLowerCase(),
      customerPhone: input.customer.phone ?? null,
      shipping: input.shipping ?? null,
      amountCop,
      currency: 'COP',
      status: 'pending',
      items: lines.map((l) =>
        manager.create(AxisOrderItem, {
          productId: l.product.id,
          productName: l.product.name,
          unitPriceCop: l.product.priceCop,
          quantity: l.quantity,
        }),
      ),
    })
    return manager.save(created)
  })

  return {
    ok: true,
    order: {
      reference: order.reference,
      orderId: order.id,
      amountCop: order.amountCop,
      currency: order.currency,
      status: order.status,
    },
  }
}
