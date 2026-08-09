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
  /** Tipo de lente elegido. Si falta, se usa el de fábrica. */
  lensOptionId?: string
  /** El cliente pidió montar su fórmula médica (complemento, se suma al lente). */
  withPrescription?: boolean
  /** Datos de la fórmula (obligatorios si la línea la lleva). */
  prescriptionNote?: string
}

export type CheckoutInput = {
  customer: { name: string; email: string; phone?: string }
  shipping?: Record<string, unknown>
  items: CheckoutItemInput[]
  /**
   * Identificador del INTENTO de compra, generado por el navegador y repetido
   * en cada reenvío del mismo formulario. Es lo que impide que un doble clic
   * cree dos pedidos (y por tanto dos cobros). Opcional para no romper a
   * clientes viejos, pero el checkout del sitio siempre lo manda.
   */
  idempotencyKey?: string
}

export type CheckoutResult = {
  reference: string
  orderId: string
  amountCop: number
  currency: string
  status: string
  /** Parámetros firmados del Web Checkout de Wompi (null si Wompi no está configurado). */
  payment: CheckoutParams | null
  /** true = este pedido ya existía; se devolvió en vez de crear otro. */
  reused?: boolean
}

export type CheckoutError = { ok: false; code: string; message: string }

function reference(): string {
  return `AXIS-${randomUUID().split('-')[0].toUpperCase()}`
}

/**
 * Empaqueta un pedido ya existente como respuesta del checkout.
 *
 * Los parámetros de Wompi se vuelven a firmar con una ventana de pago nueva: la
 * firma se calcula sobre lo que se envía en ese momento, así que re-firmar es
 * correcto y le da al comprador otra hora para pagar la MISMA referencia.
 */
function resultFor(order: AxisOrder, reused: boolean): { ok: true; order: CheckoutResult } {
  let payment: CheckoutParams | null = null
  try {
    payment = buildCheckoutParams(order.reference, order.amountCop)
  } catch (err) {
    // Sin parámetros el comprador ve un checkout sin botón de pago. Que falte la
    // config de Wompi es un caso previsto, pero enterarse por el silencio no:
    // queda el rastro para distinguirlo de un fallo real al firmar.
    console.error('[checkout] no se pudieron firmar los parámetros de Wompi:', err)
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
      reused,
    },
  }
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

  // Reenvío del mismo intento de compra: se devuelve el pedido que ya existe.
  // Se comprueba ANTES de validar stock a propósito — el pedido ya está creado
  // y sus precios congelados; volver a validar solo podría fallar por un stock
  // que cambió mientras tanto y dejar al comprador sin poder pagar lo que ya
  // tenía apartado.
  const idempotencyKey = input.idempotencyKey?.trim() || null
  if (idempotencyKey) {
    const already = await db.getRepository(AxisOrder).findOne({ where: { idempotencyKey } })
    if (already) return resultFor(already, true)
  }

  const ids = [...new Set(input.items.map((i) => i.productId))]
  const products = await db.getRepository(AxisProduct).findBy({ id: In(ids) })
  const byId = new Map(products.map((p) => [p.id, p]))

  // Opciones de lente ACTIVAS desde la DB: el sobrecosto nunca se toma del
  // cliente (igual que el precio del producto). El catálogo son dos preguntas
  // distintas: el TIPO de lente (excluyentes) y el COMPLEMENTO de fórmula.
  const lensOptions = await db.getRepository(AxisLensOption).findBy({ active: true })
  const lensTypes = lensOptions.filter((o) => o.kind !== 'prescription')
  const lensById = new Map(lensTypes.map((o) => [o.id, o]))
  const defaultLens = lensTypes.find((o) => o.isDefault) ?? null
  const prescriptionAddon = lensOptions.find((o) => o.kind === 'prescription') ?? null

  // El stock se valida por PRODUCTO, sumando todas sus líneas: un mismo modelo
  // puede venir en varias líneas si el cliente eligió lentes distintos.
  const requestedByProduct = new Map<string, number>()

  type Line = {
    product: AxisProduct
    quantity: number
    lens: AxisLensOption | null
    prescription: AxisLensOption | null
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

    // Complemento de fórmula: lo pide el cliente por su cuenta, o lo impone el
    // tipo de lente si solo existe graduado. El precio sale SIEMPRE de la DB.
    const wantsPrescription = Boolean(item.withPrescription) || Boolean(lens?.requiresPrescription)
    if (wantsPrescription && !prescriptionAddon) {
      return {
        ok: false,
        code: 'PRESCRIPTION_UNAVAILABLE',
        message: 'El montaje con fórmula médica no está disponible en este momento.',
      }
    }
    const prescription = wantsPrescription ? prescriptionAddon : null

    const prescriptionNote = item.prescriptionNote?.trim() || null
    if (prescription && !prescriptionNote) {
      return {
        ok: false,
        code: 'PRESCRIPTION_REQUIRED',
        message: `Falta la fórmula médica de ${product.name}.`,
      }
    }

    const total = (requestedByProduct.get(product.id) ?? 0) + item.quantity
    if (product.stock < total) {
      return { ok: false, code: 'INSUFFICIENT_STOCK', message: `Sin stock suficiente de ${product.name}` }
    }
    requestedByProduct.set(product.id, total)

    lines.push({ product, quantity: item.quantity, lens, prescription, prescriptionNote })
  }

  const unitPrice = (l: Line) =>
    l.product.priceCop + (l.lens?.extraPriceCop ?? 0) + (l.prescription?.extraPriceCop ?? 0)
  const amountCop = lines.reduce((sum, l) => sum + unitPrice(l) * l.quantity, 0)

  // Transacción: crea orden + líneas de forma atómica.
  let order: AxisOrder
  try {
    order = await db.transaction(async (manager) => {
      const created = manager.create(AxisOrder, {
        reference: reference(),
        idempotencyKey,
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
            prescriptionOptionId: l.prescription?.id ?? null,
            prescriptionOptionName: l.prescription?.nameEs ?? null,
            prescriptionExtraPriceCop: l.prescription?.extraPriceCop ?? 0,
            prescriptionNote: l.prescriptionNote,
          }),
        ),
      })
      return manager.save(created)
    })
  } catch (err) {
    // Dos peticiones del mismo intento entraron a la vez y las dos pasaron el
    // findOne de arriba. El índice único deja pasar solo una; la perdedora
    // recupera la ganadora en vez de devolver un error al comprador.
    if ((err as { code?: string })?.code === '23505' && idempotencyKey) {
      const winner = await db.getRepository(AxisOrder).findOne({ where: { idempotencyKey } })
      if (winner) return resultFor(winner, true)
    }
    throw err
  }

  // Parámetros firmados para el Web Checkout. Si Wompi aún no está configurado
  // (sin llaves en el .env), la orden igual se crea y payment va null.
  return resultFor(order, false)
}
