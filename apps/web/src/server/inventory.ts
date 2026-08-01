import type { DataSource, EntityManager } from 'typeorm'
import { getDb } from './db'
import { AxisProductUnit } from './db/entities/ProductUnit'
import type { UnitLensType, UnitLocation } from './db/entities/ProductUnit'
import { AxisProduct } from './db/entities/Product'
import { handleStockTransitions } from './waitlist'

/** Ubicaciones cuyas unidades cuentan como disponibles para vender. */
export const SELLABLE_LOCATIONS = ['casa', 'local'] as const

/** Cómo quedó el stock de un producto tras sincronizar, y cómo estaba antes. */
export type StockTransition = { stock: number; previous: number }

/**
 * Recalcula `axis_product.stock` contando las unidades físicas disponibles
 * (`sellable` y en casa o local). Es la única forma correcta de mover el stock
 * cuando hay inventario por unidad cargado.
 *
 * Si `productId` se omite, sincroniza todos los productos QUE TENGAN unidades:
 * los que no tienen inventario cargado conservan su `stock` manual.
 *
 * Devuelve, por producto, el stock nuevo y el anterior. La transición 0 → >0 es
 * la que dispara los avisos de la lista de espera, y este es el único punto del
 * sistema por donde el stock sube: pasarla por el valor de retorno evita que el
 * inventario tenga que saber que existe el correo (lo resuelve
 * `handleStockTransitions()` en src/server/waitlist.ts).
 */
export async function syncStockFromUnits(
  db: DataSource | EntityManager,
  productId?: string,
): Promise<Map<string, StockTransition>> {
  const manager = 'manager' in db ? db.manager : db

  const qb = manager
    .createQueryBuilder(AxisProductUnit, 'u')
    .select('u.productId', 'productId')
    .addSelect('COUNT(*)', 'count')
    .where('u.sellable = true')
    .andWhere('u.location IN (:...locations)', { locations: [...SELLABLE_LOCATIONS] })
    .groupBy('u.productId')
  if (productId) qb.andWhere('u.productId = :productId', { productId })

  const counts = new Map<string, number>(
    (await qb.getRawMany<{ productId: string; count: string }>()).map((r) => [
      r.productId,
      Number(r.count),
    ]),
  )

  // Los productos con unidades pero ninguna disponible deben quedar en 0; el
  // GROUP BY de arriba no los devuelve, así que se listan aparte.
  const withUnits = await manager
    .createQueryBuilder(AxisProductUnit, 'u')
    .select('DISTINCT u.productId', 'productId')
    .where(productId ? 'u.productId = :productId' : '1=1', { productId })
    .getRawMany<{ productId: string }>()

  for (const { productId: id } of withUnits) if (!counts.has(id)) counts.set(id, 0)

  // Stock ANTES de escribir: sin esto no hay forma de saber si el producto
  // acaba de reaparecer (0 → >0) o de agotarse (>0 → 0).
  const ids = [...counts.keys()]
  const previous = new Map<string, number>()
  if (ids.length > 0) {
    const rows = await manager
      .createQueryBuilder(AxisProduct, 'p')
      .select(['p.id AS id', 'p.stock AS stock'])
      .where('p.id IN (:...ids)', { ids })
      .getRawMany<{ id: string; stock: number }>()
    for (const row of rows) previous.set(row.id, Number(row.stock))
  }

  const transitions = new Map<string, StockTransition>()
  for (const [id, stock] of counts) {
    await manager.update(AxisProduct, { id }, { stock })
    transitions.set(id, { stock, previous: previous.get(id) ?? stock })
  }
  return transitions
}

/**
 * Marca como vendidas `quantity` unidades disponibles de un producto y las liga
 * a la línea de pedido. Se llama al CONFIRMAR el pago.
 *
 * Con inventario por unidad no se puede hacer `stock = stock - n`: ese número se
 * recalcula desde las unidades y volvería atrás. Hay que mover unidades reales.
 * Devuelve cuántas se pudieron asignar (puede ser menos si el stock cambió).
 *
 * `FOR UPDATE SKIP LOCKED` evita que dos pagos simultáneos tomen la misma unidad.
 */
export async function sellUnits(
  manager: EntityManager,
  productId: string,
  orderItemId: string,
  quantity: number,
): Promise<number> {
  const picked = await manager.query(
    `SELECT "id" FROM "axis_product_unit"
      WHERE "productId" = $1 AND "sellable" = true AND "location" IN ('casa', 'local')
      ORDER BY "unitNumber" ASC
      LIMIT $2
      FOR UPDATE SKIP LOCKED`,
    [productId, quantity],
  )
  const ids = (picked as { id: string }[]).map((r) => r.id)
  if (ids.length === 0) return 0

  await manager.query(
    `UPDATE "axis_product_unit" SET "location" = 'sold', "orderItemId" = $1, "updatedAt" = now()
      WHERE "id" = ANY($2::uuid[])`,
    [orderItemId, ids],
  )
  return ids.length
}

/**
 * Devuelve al inventario las unidades de una línea de pedido (anulación). Vuelven
 * a 'casa'; si estaban en el local, el admin lo corrige desde el panel.
 */
export async function releaseUnits(
  manager: EntityManager,
  orderItemId: string,
): Promise<number> {
  const result = await manager.query(
    `UPDATE "axis_product_unit" SET "location" = 'casa', "orderItemId" = NULL, "updatedAt" = now()
      WHERE "orderItemId" = $1 RETURNING "id"`,
    [orderItemId],
  )
  return (result as unknown[]).length
}

/** ¿Este producto tiene inventario por unidad cargado? */
export async function hasUnits(manager: EntityManager, productId: string): Promise<boolean> {
  const rows = await manager.query(
    `SELECT 1 FROM "axis_product_unit" WHERE "productId" = $1 LIMIT 1`,
    [productId],
  )
  return (rows as unknown[]).length > 0
}

// ---------- Consultas para el panel admin ----------

export type ProductUnitDTO = {
  id: string
  code: string
  productId: string
  productName: string
  modelCode: string | null
  unitNumber: number
  lensType: UnitLensType
  location: UnitLocation
  sellable: boolean
  note: string | null
}

/**
 * Unidades del inventario para el admin, opcionalmente filtradas por producto.
 * Ordenadas por modelo y número de unidad (el orden del Excel).
 */
export async function getProductUnits(productId?: string): Promise<ProductUnitDTO[]> {
  const db = await getDb()
  const qb = db
    .createQueryBuilder(AxisProductUnit, 'u')
    .innerJoin(AxisProduct, 'p', 'p.id = u."productId"')
    .select([
      'u.id AS id',
      'u.code AS code',
      'u."productId" AS "productId"',
      'p.name AS "productName"',
      'p."modelCode" AS "modelCode"',
      'u."unitNumber" AS "unitNumber"',
      'u."lensType" AS "lensType"',
      'u.location AS location',
      'u.sellable AS sellable',
      'u.note AS note',
    ])
    .orderBy('p.position', 'ASC')
    .addOrderBy('u."unitNumber"', 'ASC')
  if (productId) qb.where('u."productId" = :productId', { productId })
  return qb.getRawMany<ProductUnitDTO>()
}

export type ProductUnitPatch = {
  location?: UnitLocation
  sellable?: boolean
  note?: string | null
}

/**
 * Edita una unidad desde el panel y resincroniza el stock del producto (moverla
 * de ubicación o marcarla no vendible cambia el stock publicado).
 *
 * Es el camino habitual por el que un modelo agotado vuelve a tener stock —el
 * admin mete la unidad nueva y la pone en casa/local—, así que aquí se dispara
 * el aviso a la lista de espera. El envío va después de guardar y con sus
 * errores contenidos: un fallo de correo no puede impedir mover inventario.
 */
export async function updateProductUnit(
  id: string,
  patch: ProductUnitPatch,
): Promise<boolean> {
  const db = await getDb()
  const repo = db.getRepository(AxisProductUnit)
  const unit = await repo.findOne({ where: { id } })
  if (!unit) return false
  Object.assign(unit, patch)
  await repo.save(unit)
  const transitions = await syncStockFromUnits(db, unit.productId)
  await handleStockTransitions(transitions).catch((err) =>
    console.error('[inventario] no se pudo avisar a la lista de espera:', err),
  )
  return true
}
