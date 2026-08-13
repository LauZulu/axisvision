import { randomUUID } from 'node:crypto'
import { In } from 'typeorm'
import { getDb } from './db'
import { AxisProduct } from './db/entities/Product'
import { AxisProductLensOption } from './db/entities/ProductLensOption'
import { AxisOrder } from './db/entities/Order'
import { AxisOrderItem } from './db/entities/OrderItem'
import { AxisLensOption } from './db/entities/LensOption'
import { buildCheckoutParams, type CheckoutParams } from './wompi'
import { getRxPrices } from './lensPricing'
import { indexRxPrices, quoteLens, type LensQuote } from '../lib/lensPricing'
import {
  describePrescription,
  validatePrescription,
  type Prescription,
} from '../lib/prescription'
import type { LensOptionDTO } from '../lib/lenses'

export type CheckoutItemInput = {
  productId: string
  quantity: number
  /** Tipo de lente elegido. Si falta, se usa el de fábrica. */
  lensOptionId?: string
  /** El cliente pidió el antirreflejo (complemento; lo cobra el lente elegido). */
  withCoating?: boolean
  /** El cliente pidió montar su fórmula médica (complemento, se suma al lente). */
  withPrescription?: boolean
  /**
   * La graduación estructurada, capturada en la ficha. Es lo que decide el
   * precio del lente graduado, así que se REVALIDA y se recotiza aquí: lo que
   * mande el navegador solo dice qué quiere el cliente, nunca cuánto paga.
   */
  prescription?: Prescription
  /** Nota libre de la fórmula. Único dato de los pedidos anteriores al formulario. */
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
  // cliente (igual que el precio del producto). El catálogo son TRES preguntas
  // distintas: el TIPO de lente (excluyentes), el ANTIRREFLEJO y el COMPLEMENTO
  // de fórmula.
  // Precios de lente graduado. El árbol de decisión (potencia → índice → fila
  // de lista → estimación) lo recorre `quoteLens()` con ESTAS filas: la ficha
  // cotiza en vivo con las mismas, pero lo cobrado se recalcula siempre aquí.
  const rxPrices = indexRxPrices(await getRxPrices())

  const lensOptions = await db.getRepository(AxisLensOption).findBy({ active: true })
  const lensTypes = lensOptions.filter((o) => o.kind !== 'prescription' && o.kind !== 'coating')
  const lensById = new Map(lensTypes.map((o) => [o.id, o]))
  const prescriptionAddon = lensOptions.find((o) => o.kind === 'prescription') ?? null
  const coatingAddon = lensOptions.find((o) => o.kind === 'coating') ?? null

  // No todos los modelos ofrecen todos los lentes (Apex, la deportiva, tiene
  // uno solo). **Sin filas = los ofrece todos.** Se comprueba AQUÍ y no solo en
  // la ficha: la ficha es maquillaje, y sin esta guarda una petición a mano
  // compraba —y pagaba el sobrecosto de— un lente imposible de montar.
  const allowRows = await db
    .getRepository(AxisProductLensOption)
    .findBy({ productId: In(ids) })
  const allowedByProduct = new Map<string, Set<string>>()
  for (const row of allowRows) {
    const set = allowedByProduct.get(row.productId)
    if (set) set.add(row.lensOptionId)
    else allowedByProduct.set(row.productId, new Set([row.lensOptionId]))
  }
  const offers = (productId: string, optionId: string) => {
    const allowed = allowedByProduct.get(productId)
    return !allowed || allowed.has(optionId)
  }
  // El lente de fábrica del modelo: el marcado por defecto entre los que ofrece.
  const defaultLensFor = (productId: string) =>
    lensTypes.find((o) => o.isDefault && offers(productId, o.id)) ??
    lensTypes.find((o) => offers(productId, o.id)) ??
    null

  // El stock se valida por PRODUCTO, sumando todas sus líneas: un mismo modelo
  // puede venir en varias líneas si el cliente eligió lentes distintos.
  const requestedByProduct = new Map<string, number>()

  type Line = {
    product: AxisProduct
    quantity: number
    lens: AxisLensOption | null
    /** Fila del antirreflejo aplicada. Su PRECIO sale del lente, no de ella. */
    coating: AxisLensOption | null
    prescription: AxisLensOption | null
    /** La graduación validada, o null si la línea va sin fórmula. */
    rx: Prescription | null
    prescriptionNote: string | null
    /** Desglose de precio ya resuelto por el árbol de decisión. */
    quote: LensQuote
  }
  const lines: Line[] = []

  for (const item of input.items) {
    const product = byId.get(item.productId)
    if (!product || !product.active) {
      return { ok: false, code: 'PRODUCT_UNAVAILABLE', message: `Producto no disponible: ${item.productId}` }
    }

    const lens = item.lensOptionId
      ? (lensById.get(item.lensOptionId) ?? null)
      : defaultLensFor(product.id)
    if (item.lensOptionId && !lens) {
      return { ok: false, code: 'LENS_UNAVAILABLE', message: 'La opción de lente elegida no está disponible.' }
    }
    if (lens && !offers(product.id, lens.id)) {
      return {
        ok: false,
        code: 'LENS_NOT_OFFERED',
        message: `${product.name} no se ofrece con ese lente.`,
      }
    }

    // Antirreflejo: se monta sobre cualquier lente, así que es un complemento y
    // no un lente más. Lo que cuesta lo dice el LENTE elegido
    // (`arExtraPriceCop`), porque no vale lo mismo sobre cada uno; `null` en esa
    // columna significa que ese lente ya lo trae puesto — entonces va en la
    // línea (para que el comprobante lo diga) pero suma 0.
    const coatingIncluded = lens !== null && lens.arExtraPriceCop === null
    const askedCoating = Boolean(item.withCoating)
    if (askedCoating && !coatingAddon) {
      return {
        ok: false,
        code: 'COATING_UNAVAILABLE',
        message: 'El antirreflejo no está disponible en este momento.',
      }
    }
    if (askedCoating && coatingAddon && !offers(product.id, coatingAddon.id)) {
      return {
        ok: false,
        code: 'COATING_NOT_OFFERED',
        message: `${product.name} no se ofrece con antirreflejo.`,
      }
    }
    // Con el lente que ya lo trae, la falta del complemento en el catálogo no
    // puede tumbar la compra: simplemente no se menciona.
    const coating =
      coatingAddon && (askedCoating || coatingIncluded) && offers(product.id, coatingAddon.id)
        ? coatingAddon
        : null

    // Complemento de fórmula: lo pide el cliente por su cuenta, o lo impone el
    // tipo de lente si solo existe graduado. El precio sale SIEMPRE de la DB.
    const wantsPrescription = Boolean(item.withPrescription) || Boolean(lens?.requiresPrescription)
    if (wantsPrescription && prescriptionAddon && !offers(product.id, prescriptionAddon.id)) {
      return {
        ok: false,
        code: 'PRESCRIPTION_NOT_OFFERED',
        message: `${product.name} no admite montaje con fórmula médica.`,
      }
    }
    if (wantsPrescription && !prescriptionAddon) {
      return {
        ok: false,
        code: 'PRESCRIPTION_UNAVAILABLE',
        message: 'El montaje con fórmula médica no está disponible en este momento.',
      }
    }
    const prescription = wantsPrescription ? prescriptionAddon : null

    /**
     * La graduación estructurada. Se revalida con la MISMA función que usó el
     * formulario (`validatePrescription`): el endpoint es público, y una
     * fórmula con el eje en blanco o toda en ceros no solo sale mal tallada —
     * también cambiaría el índice y, con él, lo que hay que cobrar.
     */
    const rx = prescription ? (item.prescription ?? null) : null
    if (rx && validatePrescription(rx).length > 0) {
      return {
        ok: false,
        code: 'PRESCRIPTION_INVALID',
        message: `La fórmula de ${product.name} está incompleta.`,
      }
    }

    // El texto es lo que lee quien manda a tallar. Cuando la fórmula vino del
    // formulario se genera de los datos; si no, se acepta lo que el cliente
    // escribió a mano (carritos y pedidos anteriores al formulario).
    const prescriptionNote = rx
      ? describePrescription(rx)
      : item.prescriptionNote?.trim() || null
    if (prescription && !prescriptionNote) {
      return {
        ok: false,
        code: 'PRESCRIPTION_REQUIRED',
        message: `Falta la fórmula médica de ${product.name}.`,
      }
    }

    // Aquí se decide el precio del lente: sin fórmula es el terminado de
    // siempre; con fórmula, el graduado que corresponda a su índice.
    const quote = quoteLens({
      lens: lens as LensOptionDTO | null,
      withCoating: coating !== null,
      rx,
      prices: rxPrices,
    })

    const total = (requestedByProduct.get(product.id) ?? 0) + item.quantity
    if (product.stock < total) {
      return { ok: false, code: 'INSUFFICIENT_STOCK', message: `Sin stock suficiente de ${product.name}` }
    }
    requestedByProduct.set(product.id, total)

    lines.push({
      product,
      quantity: item.quantity,
      lens,
      coating,
      prescription,
      rx,
      prescriptionNote,
      quote,
    })
  }

  /**
   * Precio unitario = montura + todo lo del lente.
   *
   * Ya no se suman opciones sueltas: el desglose (lente base, sobrecosto de la
   * graduación y antirreflejo) lo resolvió `quoteLens()`, que es el único sitio
   * donde vive la regla. Sumarlo aquí a mano era exactamente lo que hacía que
   * cambiar un precio obligara a tocar tres archivos.
   */
  const unitPrice = (l: Line) => l.product.priceCop + l.quote.extraCop
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
            // El lente SIN graduar. El sobrecosto de tallarlo va aparte, en la
            // fila de la fórmula, para que el comprobante lo pueda desglosar.
            lensExtraPriceCop: l.quote.lensBaseCop,
            coatingOptionId: l.coating?.id ?? null,
            coatingOptionName: l.coating?.nameEs ?? null,
            coatingExtraPriceCop: l.quote.coatingCop,
            prescriptionOptionId: l.prescription?.id ?? null,
            prescriptionOptionName: l.prescription?.nameEs ?? null,
            prescriptionExtraPriceCop: l.quote.rxDeltaCop,
            prescriptionNote: l.prescriptionNote,
            // La fórmula estructurada, el índice aplicado y si el precio salió
            // de la lista o de la estimación: los tres son parte de lo que se
            // le prometió al cliente y no pueden depender de filas que se
            // editen después.
            prescriptionRx: l.rx ? (l.rx as unknown as Record<string, unknown>) : null,
            prescriptionRxType: l.quote.rxType,
            prescriptionIndex: l.quote.index,
            prescriptionEstimated: l.quote.estimated,
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
