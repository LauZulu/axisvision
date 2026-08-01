// DTO de reserva compartido entre servidor (lo arma desde la DB) y cliente (la
// tabla del panel lo consume). Sin imports de servidor → seguro en componentes
// cliente, igual que products.ts y orders.ts.

export type StockAlertStatusDTO = 'pending' | 'active' | 'notified' | 'unsubscribed'
export type StockAlertSourceDTO = 'sold_out' | 'preview'

export type StockAlertDTO = {
  id: string
  email: string
  status: StockAlertStatusDTO
  source: StockAlertSourceDTO
  productId: string
  productName: string
  productSlug: string
  /** Stock actual del modelo, para ver de un vistazo si ya se puede avisar. */
  stock: number
  createdAt: string
  notifiedAt: string | null
}
