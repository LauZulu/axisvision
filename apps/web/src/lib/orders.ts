// DTO y helpers de pedidos, compartidos servidor/cliente (sin imports de servidor).
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'failed'

export type OrderItemDTO = {
  productName: string
  unitPriceCop: number
  quantity: number
  /**
   * Cómo se montan estas gafas. Sin esto el panel solo decía "1× AXIS Origin",
   * y quien tiene que mandar a tallar no tenía dónde leer la graduación: vivía
   * en la DB y en el correo del cliente, en ningún sitio del panel.
   */
  lensOptionName: string | null
  coatingOptionName: string | null
  /** La fórmula ya formateada (`describePrescription`). null = sin graduación. */
  prescriptionNote: string | null
  /** Índice del material que salió de esa fórmula ('1.60'). */
  prescriptionIndex: string | null
  /** true = el precio del lente graduado fue estimado, no de la lista. */
  prescriptionEstimated: boolean
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
