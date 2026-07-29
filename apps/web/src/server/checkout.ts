import { randomUUID } from 'node:crypto'
import { In } from 'typeorm'
import { getDb } from './db'
import { AxisProduct } from './db/entities/Product'
import { AxisOrder } from './db/entities/Order'
import { AxisOrderItem } from './db/entities/OrderItem'
import { AxisLensOption } from './db/entities/LensOption'
import { buildCheckoutParams, type CheckoutParams } from './wompi'

export type CheckoutItemInput = {
  productId: string
  quantity: number
  /** Opción de lente elegida. Si falta, se usa la de fábrica. */
  lensOptionId?: string
  /** Fórmula médica cuando la opción la exige. */
  prescriptionNote?: string
}

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
  /** Parámetros firmados del Web Checkout de Wompi (null si Wompi no está configurado). */
  payment: CheckoutParams | null
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

  // Opciones de lente ACTIVAS desde la DB: el sobrecosto nunca se toma del
  // cliente (igual que el precio del producto).
  const lensOptions = await db.getRepository(AxisLensOption).findBy({ active: true })
  const lensById = new Map(lensOptions.map((o) => [o.id, o]))
  const defaultLens = lensOptions.find((o) => o.isDefault) ?? null

  // El stock se valida por PRODUCTO, sumando todas sus líneas: un mismo modelo
  // puede venir en varias líneas si el cliente eligió lentes distintos.
  const requestedByProduct = new Map<string, number>()

  type Line = {
    product: AxisProduct
    quantity: number
    lens: AxisLensOption | null
    prescriptionNote: string | null
  }
  const lines: Line[] = []

  for (const item of input.items) {
    const product = byId.get(item.productId)
    if (!product || !product.active) {
      return { ok: false, code: 'PRODUCT_UNAVAILABLE', message: `Producto no disponible: ${item.productId}` }
    }

    const lens = item.lensOptionId ? (lensById.get(item.lensOptionId) ?? null) : defaultLens
    if (item.lensOptionId && !lens) {
      return { ok: false, code: 'LENS_UNAVAILABLE', message: 'La opción de lente elegida no está disponible.' }
    }

    const prescriptionNote = item.prescriptionNote?.trim() || null
    if (lens?.requiresPrescription && !prescriptionNote) {
      return {
        ok: false,
        code: 'PRESCRIPTION_REQUIRED',
        message: `Falta la fórmula para el lente "${lens.nameEs}" de ${product.name}.`,
      }
    }

    const total = (requestedByProduct.get(product.id) ?? 0) + item.quantity
    if (product.stock < total) {
      return { ok: false, code: 'INSUFFICIENT_STOCK', message: `Sin stock suficiente de ${product.name}` }
    }
    requestedByProduct.set(product.id, total)

    lines.push({ product, quantity: item.quantity, lens, prescriptionNote })
  }

  const unitPrice = (l: Line) => l.product.priceCop + (l.lens?.extraPriceCop ?? 0)
  const amountCop = lines.reduce((sum, l) => sum + unitPrice(l) * l.quantity, 0)

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
          unitPriceCop: unitPrice(l),
          quantity: l.quantity,
          lensOptionId: l.lens?.id ?? null,
          lensOptionName: l.lens?.nameEs ?? null,
          lensExtraPriceCop: l.lens?.extraPriceCop ?? 0,
          prescriptionNote: l.prescriptionNote,
        }),
      ),
    })
    return manager.save(created)
  })

  // Parámetros firmados para el Web Checkout. Si Wompi aún no está configurado
  // (sin llaves en el .env), la orden igual se crea y payment va null.
  let payment: CheckoutParams | null = null
  try {
    payment = buildCheckoutParams(order.reference, order.amountCop)
  } catch {
    payment = null
  }

  return {
    ok: true,
    order: {
      reference: order.reference,
      orderId: order.id,
      amountCop: order.amountCop,
      currency: order.currency,
      status: order.status,
      payment,
    },
  }
}
