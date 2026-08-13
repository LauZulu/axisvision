import { z } from 'zod'
import { createGuestOrder } from '../../../src/server/checkout'
import { json, jsonError, clientIp } from '../../../src/server/http'
import { rateLimit } from '../../../src/server/rateLimit'
import { canCheckout, previewReason } from '../../../src/server/storeMode'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Checkout de INVITADO: sin cuenta, todos los datos vienen en el payload.
const schema = z.object({
  customer: z.object({
    name: z.string().min(1).max(120),
    email: z.string().email().max(255),
    phone: z.string().max(40).optional(),
  }),
  shipping: z.record(z.string(), z.unknown()).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(20),
        // El lente elegido: solo el id. El sobrecosto lo pone el servidor.
        lensOptionId: z.string().uuid().optional(),
        // El antirreflejo también es un complemento: el cliente dice si lo
        // quiere y el servidor mira qué cuesta sobre el lente que eligió.
        withCoating: z.boolean().optional(),
        // La fórmula es un complemento aparte: el cliente solo dice si la quiere.
        withPrescription: z.boolean().optional(),
        prescriptionNote: z.string().max(1000).optional(),
      }),
    )
    .min(1)
    .max(20),
  // Identificador del intento de compra. Lo genera el navegador y lo repite en
  // cada reenvío: es lo que hace que un doble clic devuelva el MISMO pedido en
  // vez de crear otro con otra referencia (y otro cobro).
  idempotencyKey: z.string().uuid().optional(),
})

export async function POST(req: Request) {
  // Guarda dura del modo tienda. El front ya esconde el botón de comprar cuando
  // la tienda está en modo reserva, pero eso es maquillaje: sin esta línea,
  // cualquiera con curl crearía pedidos que nadie puede pagar.
  if (!canCheckout()) {
    console.warn(`[checkout] rechazado — tienda en modo reserva (${previewReason()})`)
    return jsonError(
      'STORE_PREVIEW',
      'La tienda todavía no acepta pagos en línea. Déjanos tu correo y te avisamos apenas abramos.',
      503,
    )
  }

  if (!rateLimit(`checkout:${clientIp(req)}`, 10, 60_000)) {
    return jsonError('RATE_LIMITED', 'Demasiados intentos. Espera un minuto.', 429)
  }

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return jsonError('INVALID_BODY', 'Datos de compra inválidos.', 400)
  }

  try {
    const result = await createGuestOrder(parsed.data)
    if (!result.ok) {
      return jsonError(result.code, result.message, 409)
    }
    // La pasarela de pago (Wompi) se enganchará aquí en la Fase 7, usando
    // result.order.reference y amountCop para iniciar la transacción.
    return json({ order: result.order }, 201)
  } catch (err) {
    console.error('[checkout] fallo creando el pedido:', err)
    return jsonError('SERVICE_UNAVAILABLE', 'No se pudo procesar la compra. Inténtalo más tarde.', 503)
  }
}
