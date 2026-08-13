import { getDb } from './db'
import { AxisOrder } from './db/entities/Order'
import type { OrderDTO, OrderStatus } from '../lib/orders'
import { REVENUE_STATUSES } from '../lib/orders'

function toDTO(o: AxisOrder): OrderDTO {
  const items = (o.items ?? []).map((i) => ({
    productName: i.productName,
    unitPriceCop: i.unitPriceCop,
    quantity: i.quantity,
    lensOptionName: i.lensOptionName,
    coatingOptionName: i.coatingOptionName,
    prescriptionNote: i.prescriptionNote,
    prescriptionIndex: i.prescriptionIndex,
    prescriptionEstimated: Boolean(i.prescriptionEstimated),
  }))
  return {
    id: o.id,
    reference: o.reference,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    customerPhone: o.customerPhone,
    amountCop: o.amountCop,
    currency: o.currency,
    status: o.status as OrderStatus,
    itemsCount: items.reduce((sum, i) => sum + i.quantity, 0),
    items,
    createdAt: o.createdAt.toISOString(),
  }
}

export async function getRecentOrders(limit = 8): Promise<OrderDTO[]> {
  const db = await getDb()
  const rows = await db.getRepository(AxisOrder).find({
    relations: { items: true },
    order: { createdAt: 'DESC' },
    take: limit,
  })
  return rows.map(toDTO)
}

export async function getAllOrders(): Promise<OrderDTO[]> {
  const db = await getDb()
  const rows = await db.getRepository(AxisOrder).find({
    relations: { items: true },
    order: { createdAt: 'DESC' },
  })
  return rows.map(toDTO)
}

export type OrderStats = { total: number; pending: number; revenueCop: number }

/** Las tres cifras en una sola pasada (ver la nota de `getAdminStats`). */
export async function getOrderStats(): Promise<OrderStats> {
  const db = await getDb()
  const row = await db
    .getRepository(AxisOrder)
    .createQueryBuilder('o')
    .select('COUNT(*)', 'total')
    .addSelect("COUNT(*) FILTER (WHERE o.status = 'pending')", 'pending')
    .addSelect(
      'COALESCE(SUM(o."amountCop") FILTER (WHERE o.status IN (:...statuses)), 0)',
      'revenue',
    )
    .setParameter('statuses', REVENUE_STATUSES)
    .getRawOne<{ total: string; pending: string; revenue: string }>()
  return {
    total: Number(row?.total ?? 0),
    pending: Number(row?.pending ?? 0),
    revenueCop: Number(row?.revenue ?? 0),
  }
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<boolean> {
  const db = await getDb()
  const result = await db.getRepository(AxisOrder).update({ id }, { status })
  return (result.affected ?? 0) > 0
}
