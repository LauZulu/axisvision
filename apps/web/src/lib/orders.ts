// DTO y helpers de pedidos, compartidos servidor/cliente (sin imports de servidor).
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'failed'

export type OrderItemDTO = {
  productName: string
  unitPriceCop: number
  quantity: number
}

export type OrderDTO = {
  id: string
  reference: string
  customerName: string
  customerEmail: string
  customerPhone: string | null
  amountCop: number
  currency: string
  status: OrderStatus
  itemsCount: number
  items: OrderItemDTO[]
  createdAt: string
}

export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
  'failed',
]

export const orderStatusLabel: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  failed: 'Fallido',
}

/** Estados que cuentan como ingreso (venta concretada). */
export const REVENUE_STATUSES: OrderStatus[] = ['paid', 'shipped', 'delivered']
