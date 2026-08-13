import { z } from 'zod'
import {
  deleteRxPrice,
  getRxPrices,
  upsertRxPrice,
} from '../../../../../src/server/lensPricing'
import { requireAdmin } from '../../../../../src/server/guard'
import { json, jsonError } from '../../../../../src/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * La matriz de precios de lente graduado: (lente × monofocal/progresiva ×
 * índice) → precio.
 *
 * Es un upsert por celda y no un CRUD de filas: el panel edita una tabla, y
 * "guardar dos veces la misma celda" tiene que ser la misma fila. Borrar NO es
 * poner 0 — sin fila, el motor vuelve a estimar el precio, que es justo lo que
 * se quiere cuando alguien se da cuenta de que ese número estaba mal. Un 0
 * regalaría el lente.
 */
const schema = z.object({
  lensOptionId: z.string().uuid(),
  rxType: z.enum(['single', 'progressive']),
  lensIndex: z.enum(['1.50', '1.56', '1.60', '1.67', '1.74']),
  // Sin tope superior arbitrario, pero no negativo: un precio negativo
  // restaría del total del pedido.
  priceCop: z.number().int().min(0).max(50_000_000),
  // null = ese lente graduado ya trae el antirreflejo (mismo significado que en
  // `axis_lens_option.arExtraPriceCop`).
  arExtraPriceCop: z.number().int().min(0).max(50_000_000).nullable(),
})

const deleteSchema = schema.pick({ lensOptionId: true, rxType: true, lensIndex: true })

export async function GET() {
  const gate = await requireAdmin()
  if (gate.response) return gate.response
  try {
    return json({ prices: await getRxPrices() })
  } catch (err) {
    console.error('[admin/lentes] no se pudieron cargar los precios graduados:', err)
    return jsonError('DB_UNAVAILABLE', 'No se pudieron cargar los precios.', 503)
  }
}

export async function POST(req: Request) {
  const gate = await requireAdmin()
  if (gate.response) return gate.response

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return jsonError('INVALID_BODY', 'Precio inválido.', 400)

  try {
    await upsertRxPrice(parsed.data)
    return json({ ok: true })
  } catch (err) {
    console.error('[admin/lentes] no se pudo guardar el precio graduado:', err)
    return jsonError('DB_ERROR', 'No se pudo guardar el precio.', 500)
  }
}

export async function DELETE(req: Request) {
  const gate = await requireAdmin()
  if (gate.response) return gate.response

  const parsed = deleteSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return jsonError('INVALID_BODY', 'Celda inválida.', 400)

  try {
    const done = await deleteRxPrice(
      parsed.data.lensOptionId,
      parsed.data.rxType,
      parsed.data.lensIndex,
    )
    return json({ ok: done })
  } catch (err) {
    console.error('[admin/lentes] no se pudo borrar el precio graduado:', err)
    return jsonError('DB_ERROR', 'No se pudo borrar el precio.', 500)
  }
}
