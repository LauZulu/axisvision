/**
 * Formas de los datos que recibe cada plantilla.
 *
 * Son tipos PROPIOS del correo, no las entidades de TypeORM: la plantilla nunca
 * debe recibir un `AxisOrder` crudo (arrastraría relaciones perezosas y campos
 * que no queremos que un renderizador toque). Quien envía arma el payload.
 */

/** Lo que devuelve una plantilla, listo para la API de Brevo. */
export type EmailDoc = {
  /** Asunto ya interpolado. Sin emojis: bajan la entregabilidad en dominios propios. */
  subject: string
  /** Texto de vista previa (lo que se ve junto al asunto en la bandeja). */
  preheader: string
  html: string
  /** Alternativa en texto plano. Obligatoria: un correo solo-HTML puntúa peor en spam. */
  text: string
}

/** Línea de pedido tal como la muestra el correo (snapshot, ya con el lente). */
export type OrderLine = {
  productName: string
  quantity: number
  /** Precio unitario COBRADO = producto + extra del lente. */
  unitPriceCop: number
  lensOptionName?: string | null
  lensExtraPriceCop?: number | null
  coatingOptionName?: string | null
  coatingExtraPriceCop?: number | null
  prescriptionOptionName?: string | null
  prescriptionExtraPriceCop?: number | null
  prescriptionNote?: string | null
  /**
   * true = el precio del lente graduado salió de la fórmula genérica y no de
   * la lista del laboratorio. Va al correo porque es lo que se le dijo al
   * comprar: sin repetirlo aquí, el ajuste posterior llega sin aviso.
   */
  prescriptionEstimated?: boolean | null
}

/** Datos comunes a todos los correos de un pedido. */
export type OrderEmailData = {
  reference: string
  customerName: string
  customerEmail: string
  amountCop: number
  lines: OrderLine[]
  createdAt: Date | string
  paidAt?: Date | string | null
  paymentMethodType?: string | null
  /** Dirección de envío ya aplanada (el pedido la guarda como jsonb). */
  shipping?: {
    address?: string | null
    city?: string | null
    department?: string | null
    notes?: string | null
  } | null
}

export type OrderShippedData = OrderEmailData & {
  carrier: string
  trackingCode: string
  trackingUrl?: string | null
  /** Rango estimado, ya en texto ("2 a 4 días hábiles"). */
  etaLabel?: string | null
}

export type OrderFailedData = OrderEmailData & {
  /** Motivo que reporta la pasarela, si lo hay. Se muestra tal cual. */
  reason?: string | null
  /** Link para reintentar el pago (checkout con el carrito rearmado). */
  retryUrl: string
}

export type CheckoutAbandonedData = OrderEmailData & {
  resumeUrl: string
  /** Unidades que quedan del modelo principal, si son pocas. */
  unitsLeft?: number | null
}

export type PrescriptionData = {
  reference: string
  customerName: string
  /** Solo las líneas que exigen fórmula médica. */
  lines: OrderLine[]
  /** A dónde mandar la fórmula (WhatsApp por defecto). */
  uploadUrl?: string | null
}

export type OrderDeliveredData = OrderEmailData & {
  /** Encuesta o reseña. Si falta, el correo cierra sin CTA de reseña. */
  reviewUrl?: string | null
}

// --- Reserva / lista de espera ---

export type WaitlistData = {
  email: string
  productName: string
  productUrl: string
  /** URL absoluta de CloudFront de la foto de portada. Opcional. */
  imageUrl?: string | null
  /** Link con token para darse de baja. Obligatorio en todo correo de lista. */
  unsubscribeUrl: string
}

export type WaitlistVerifyData = WaitlistData & {
  verifyUrl: string
  expiresHours: number
}

export type WaitlistAvailableData = WaitlistData & {
  priceCop: number
  compareAtPriceCop?: number | null
  /** Unidades disponibles al momento de avisar. */
  unitsLeft: number
  /** Horas que le guardamos la prioridad antes de avisar al resto de la lista. */
  holdHours?: number | null
}

export type WaitlistReminderData = WaitlistAvailableData & {
  /** true = se volvió a agotar; false = sigue disponible, es un recordatorio. */
  soldOutAgain: boolean
}

// --- Internos (admin) ---

export type AdminNewOrderData = OrderEmailData & {
  adminUrl: string
  /** Seriales de las unidades que el webhook marcó como vendidas. */
  soldUnits?: string[]
}

export type AdminOutOfStockData = {
  productName: string
  modelCode: string | null
  /** Cuánta gente está esperando ese modelo en la lista. */
  waitingCount: number
  adminUrl: string
}

/**
 * Cita para tomar la fórmula. El teléfono viaja YA formateado (`phoneDisplay`)
 * y como enlace (`whatsappUrl`): la plantilla es pura y no puede importar
 * `phone.ts` para decidir cómo se escribe un número colombiano.
 */
export type AdminAppointmentData = {
  name: string
  phoneDisplay: string
  whatsappUrl: string
  productName: string | null
  lensName: string | null
  city: string | null
  preferredTime: string | null
  note: string | null
  adminUrl: string
}

export type AdminWaitlistDigestData = {
  /** Una fila por modelo, ordenada de más a menos gente esperando. */
  rows: Array<{ productName: string; modelCode: string | null; waitingCount: number; unitsLeft: number }>
  since: Date | string
  adminUrl: string
}

export type AdminPasswordResetData = {
  name: string
  resetUrl: string
  expiresMinutes: number
  /** IP desde donde se pidió, para que se note si no fue el dueño de la cuenta. */
  requestIp?: string | null
}

/**
 * Alerta interna cuando un pago no encaja con el pedido. Los tres casos en los
 * que hay dinero real de por medio y el sistema no puede decidir solo.
 */
export type AdminPaymentAlertData = {
  kind: 'double_charge' | 'amount_mismatch' | 'approved_on_failed'
  reference: string
  orderStatus: string
  transactionId: string
  /** Id de transacción que el pedido ya tenía guardado, si había otro. */
  storedTransactionId?: string | null
  expectedCop: number
  receivedCop: number
  adminUrl: string
}
