import { getDb } from './db'
import { AxisLensRxPrice } from './db/entities/LensRxPrice'
import type { RxPriceDTO } from '../lib/lensPricing'
import { LENS_INDEXES, type LensIndex, type RxType } from '../lib/prescription'

/**
 * Las filas de precio graduado, leídas de la DB.
 *
 * El árbol de decisión (qué índice, qué precio, cuándo estimar) vive en
 * `src/lib/lensPricing.ts` porque la ficha también lo recorre para cotizar en
 * vivo. Este módulo solo pone los DATOS: lo que se COBRA se recalcula siempre
 * aquí, con estas filas, nunca con las que traiga el navegador.
 */

function toDTO(row: AxisLensRxPrice): RxPriceDTO {
  return {
    id: row.id,
    lensOptionId: row.lensOptionId,
    rxType: row.rxType,
    lensIndex: row.lensIndex,
    priceCop: row.priceCop,
    arExtraPriceCop: row.arExtraPriceCop ?? null,
  }
}

/** Todos los precios graduados conocidos. Son pocas filas: no vale paginar. */
export async function getRxPrices(): Promise<RxPriceDTO[]> {
  const db = await getDb()
  const rows = await db.getRepository(AxisLensRxPrice).find({
    order: { lensOptionId: 'ASC', rxType: 'ASC', lensIndex: 'ASC' },
  })
  return rows.map(toDTO)
}

export type RxPriceInput = {
  lensOptionId: string
  rxType: RxType
  lensIndex: LensIndex
  priceCop: number
  /** null = ese lente graduado ya trae el antirreflejo. */
  arExtraPriceCop: number | null
}

/**
 * Guarda un renglón de la matriz. Es un upsert por (lente, tipo, índice): el
 * panel edita una celda de una tabla, no crea filas sueltas, así que "guardar
 * dos veces la misma celda" tiene que ser la misma fila y no un duplicado que
 * el índice único rechazaría con un 500.
 */
export async function upsertRxPrice(input: RxPriceInput): Promise<void> {
  const db = await getDb()
  await db
    .getRepository(AxisLensRxPrice)
    .createQueryBuilder()
    .insert()
    .values({
      lensOptionId: input.lensOptionId,
      rxType: input.rxType,
      lensIndex: input.lensIndex,
      priceCop: input.priceCop,
      arExtraPriceCop: input.arExtraPriceCop,
    })
    .orUpdate(['priceCop', 'arExtraPriceCop', 'updatedAt'], [
      'lensOptionId',
      'rxType',
      'lensIndex',
    ])
    .execute()
}

/**
 * Borra un renglón. NO es lo mismo que ponerlo en 0: sin fila, `quoteLens()`
 * vuelve a estimar el precio, que es lo que queremos cuando alguien se dio
 * cuenta de que ese número estaba mal. Un 0 vendería el lente regalado.
 */
export async function deleteRxPrice(
  lensOptionId: string,
  rxType: RxType,
  lensIndex: LensIndex,
): Promise<boolean> {
  const db = await getDb()
  const result = await db
    .getRepository(AxisLensRxPrice)
    .delete({ lensOptionId, rxType, lensIndex })
  return (result.affected ?? 0) > 0
}

/** Los índices válidos, para validar lo que llega del panel. */
export function isLensIndex(value: string): value is LensIndex {
  return (LENS_INDEXES as string[]).includes(value)
}
