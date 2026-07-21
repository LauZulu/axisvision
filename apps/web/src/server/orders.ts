import { getDb } from './db'
import { AxisOrder } from './db/entities/Order'
import type { OrderDTO, OrderStatus } from '../lib/orders'
import { REVENUE_STATUSES } from '../lib/orders'

function toDTO(o: AxisOrder): OrderDTO {
  const items = (o.items ?? []).map((i) => ({
    productName: i.productName,
    unitPriceCop: i.unitPriceCop,
    quantity: i.quantity,
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

export async function getOrderStats(): Promise<OrderStats> {
  const db = await getDb()
  const repo = db.getRepository(AxisOrder)
  const [total, pending] = await Promise.all([
    repo.count(),
    repo.count({ where: { status: 'pending' } }),
  ])
  const rev = await repo
    .createQueryBuilder('o')
    .select('COALESCE(SUM(o."amountCop"), 0)', 'total')
    .where('o.status IN (:...statuses)', { statuses: REVENUE_STATUSES })
    .getRawOne<{ total: string }>()
  return { total, pending, revenueCop: Number(rev?.total ?? 0) }
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<boolean> {
  const db = await getDb()
  const result = await db.getRepository(AxisOrder).update({ id }, { status })
  return (result.affected ?? 0) > 0
}
