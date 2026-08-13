/**
 * Datos de ejemplo para la vista previa (`pnpm email:preview`).
 *
 * Son deliberadamente incómodos: nombre con tilde, nota de fórmula de varias
 * líneas, dos veces el mismo modelo con lentes distintos, precio con descuento.
 * Un ejemplo bonito no revela que la tabla se rompe con nombres largos.
 *
 * No se importan en producción — solo el script de vista previa los usa.
 */
import type {
  AdminNewOrderData,
  AdminPaymentAlertData,
  AdminAppointmentData,
  AdminOutOfStockData,
  AdminPasswordResetData,
  AdminWaitlistDigestData,
  CheckoutAbandonedData,
  OrderDeliveredData,
  OrderEmailData,
  OrderFailedData,
  OrderShippedData,
  PrescriptionData,
  WaitlistAvailableData,
  WaitlistData,
  WaitlistReminderData,
  WaitlistVerifyData,
} from './types'
import { siteUrl } from './format'

const CREATED = new Date('2026-07-28T15:42:00.000Z')
const PAID = new Date('2026-07-28T15:44:00.000Z')

export const SAMPLE_ORDER: OrderEmailData = {
  reference: 'AXIS-8F3K2M',
  customerName: 'María Fernanda Ríos',
  customerEmail: 'maria.rios@example.com',
  amountCop: 2_910_000,
  createdAt: CREATED,
  paidAt: PAID,
  paymentMethodType: 'NEQUI',
  lines: [
    {
      productName: 'AXIS Origin',
      quantity: 1,
      unitPriceCop: 1_400_000,
      lensOptionName: 'Sol polarizado',
      lensExtraPriceCop: 0,
    },
    {
      productName: 'AXIS Origin',
      quantity: 1,
      unitPriceCop: 1_510_000,
      lensOptionName: 'Lente transparente',
      lensExtraPriceCop: 90_000,
      coatingOptionName: 'Antirreflejo',
      coatingExtraPriceCop: 20_000,
      // La fórmula va SIN sobrecosto a propósito: es la que se cotiza al
      // recibirla, y la plantilla tiene que enseñar "valor por confirmar".
      prescriptionOptionName: 'Con tu fórmula médica',
      prescriptionExtraPriceCop: 0,
      prescriptionNote: 'OD: -2.25 / -0.75 x 180\nOI: -2.00 / -0.50 x 175\nAdición: +1.00\nDP: 62',
    },
  ],
  shipping: {
    address: 'Carrera 43A # 18-95, apto 1204',
    city: 'Medellín',
    department: 'Antioquia',
    notes: 'Portería recibe hasta las 6 p. m.',
  },
}

export const SAMPLE_FAILED: OrderFailedData = {
  ...SAMPLE_ORDER,
  paidAt: null,
  reason: 'La transacción fue rechazada por el banco emisor (fondos insuficientes).',
  retryUrl: siteUrl('/tienda/checkout?retry=AXIS-8F3K2M'),
}

export const SAMPLE_SHIPPED: OrderShippedData = {
  ...SAMPLE_ORDER,
  carrier: 'Coordinadora',
  trackingCode: '9204 8811 2033',
  trackingUrl: 'https://www.coordinadora.com/rastreo/920488112033',
  etaLabel: '2 a 4 días hábiles',
}

export const SAMPLE_DELIVERED: OrderDeliveredData = {
  ...SAMPLE_ORDER,
  reviewUrl: siteUrl('/opinion/AXIS-8F3K2M'),
}

export const SAMPLE_ABANDONED: CheckoutAbandonedData = {
  ...SAMPLE_ORDER,
  paidAt: null,
  paymentMethodType: null,
  resumeUrl: siteUrl('/tienda/checkout?pedido=AXIS-8F3K2M'),
  unitsLeft: 2,
}

export const SAMPLE_PRESCRIPTION: PrescriptionData = {
  reference: SAMPLE_ORDER.reference,
  customerName: SAMPLE_ORDER.customerName,
  lines: SAMPLE_ORDER.lines.filter((l) => l.prescriptionNote),
  uploadUrl: null,
}

const WAITLIST_BASE: WaitlistData = {
  email: 'maria.rios@example.com',
  productName: 'Eclypse',
  productUrl: siteUrl('/tienda/eclypse'),
  imageUrl: null,
  unsubscribeUrl: siteUrl('/reservas/baja?token=demo-token'),
}

export const SAMPLE_WAITLIST: WaitlistData = WAITLIST_BASE

export const SAMPLE_WAITLIST_VERIFY: WaitlistVerifyData = {
  ...WAITLIST_BASE,
  verifyUrl: siteUrl('/reservas/confirmar?token=demo-token'),
  expiresHours: 48,
}

export const SAMPLE_WAITLIST_AVAILABLE: WaitlistAvailableData = {
  ...WAITLIST_BASE,
  priceCop: 1_390_000,
  compareAtPriceCop: 1_590_000,
  unitsLeft: 3,
  holdHours: 24,
}

export const SAMPLE_WAITLIST_REMINDER: WaitlistReminderData = {
  ...SAMPLE_WAITLIST_AVAILABLE,
  unitsLeft: 1,
  soldOutAgain: false,
}

export const SAMPLE_WAITLIST_SOLDOUT: WaitlistReminderData = {
  ...SAMPLE_WAITLIST_AVAILABLE,
  unitsLeft: 0,
  soldOutAgain: true,
}

export const SAMPLE_ADMIN_ORDER: AdminNewOrderData = {
  ...SAMPLE_ORDER,
  adminUrl: siteUrl('/admin/pedidos'),
  soldUnits: ['AX014', 'AX027'],
}

export const SAMPLE_ADMIN_OUT_OF_STOCK: AdminOutOfStockData = {
  productName: 'AXIS Crystal',
  modelCode: 'HK01',
  waitingCount: 7,
  adminUrl: siteUrl('/admin/inventario'),
}

export const SAMPLE_ADMIN_APPOINTMENT: AdminAppointmentData = {
  name: 'Laura Gómez',
  phoneDisplay: '+57 312 372 7253',
  whatsappUrl: 'https://wa.me/573123727253',
  productName: 'AXIS Origin',
  lensName: 'Lente de sol polarizado',
  city: 'Bogotá',
  preferredTime: 'Tardes entre semana',
  note: 'Mi fórmula es de hace dos años, prefiero que me la revisen.',
  adminUrl: siteUrl('/admin/citas'),
}

export const SAMPLE_ADMIN_DIGEST: AdminWaitlistDigestData = {
  since: new Date('2026-07-21T05:00:00.000Z'),
  adminUrl: siteUrl('/admin/reservas'),
  rows: [
    { productName: 'AXIS Crystal', modelCode: 'HK01', waitingCount: 7, unitsLeft: 0 },
    { productName: 'AXIS Eclypse', modelCode: 'M01PRO', waitingCount: 4, unitsLeft: 0 },
    { productName: 'AXIS Origin', modelCode: 'M02', waitingCount: 2, unitsLeft: 5 },
  ],
}

export const SAMPLE_ADMIN_RESET: AdminPasswordResetData = {
  name: 'Felipe',
  resetUrl: siteUrl('/admin/clave?token=demo-token'),
  expiresMinutes: 30,
  requestIp: '186.29.14.203',
}

export const SAMPLE_ADMIN_PAYMENT_ALERT: AdminPaymentAlertData = {
  kind: 'double_charge',
  reference: SAMPLE_ORDER.reference,
  orderStatus: 'paid',
  transactionId: '113344-1690000000-55555',
  storedTransactionId: '113344-1689999000-44444',
  expectedCop: SAMPLE_ORDER.amountCop,
  receivedCop: SAMPLE_ORDER.amountCop,
  adminUrl: siteUrl('/admin/pedidos'),
}
