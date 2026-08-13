// DTO de reserva compartido entre servidor (lo arma desde la DB) y cliente (la
// tabla del panel lo consume). Sin imports de servidor → seguro en componentes
// cliente, igual que products.ts y orders.ts.

export type StockAlertStatusDTO = 'pending' | 'active' | 'notified' | 'unsubscribed'
export type StockAlertSourceDTO = 'sold_out' | 'preview'

export type StockAlertDTO = {
  id: string
  /** Null solo en reservas anteriores al formulario con nombre y WhatsApp. */
  name: string | null
  /** Canónico (`573123727253`); usar `formatPhone()`/`whatsappTo()` para pintarlo. */
  phone: string | null
  /** Opcional: sin correo, a esa persona se le escribe por WhatsApp. */
  email: string | null
  status: StockAlertStatusDTO
  source: StockAlertSourceDTO
  productId: string
  productName: string
  productSlug: string
  /** Stock actual del modelo, para ver de un vistazo si ya se puede avisar. */
  stock: number
  createdAt: string
  notifiedAt: string | null
  /**
   * Cómo quería las gafas. Es lo que permite escribirle sin volver a
   * preguntar nada ("ya llegó tu Origin, la que querías con transitions").
   * `lensName` es null en las reservas de `/reservas`, que no lo preguntan.
   */
  lensName: string | null
  withCoating: boolean
  withPrescription: boolean
}
