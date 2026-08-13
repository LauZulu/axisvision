/**
 * Registro de plantillas.
 *
 * Cada entrada es lo mismo que se ve en la vista previa y lo que se envía en
 * producción: si una plantilla no está aquí, no existe para el sistema.
 */
import type { EmailDoc } from '../types'
import * as S from '../samples'

import { renderOrderPaid } from './orderPaid'
import { renderOrderFailed } from './orderFailed'
import { renderOrderCancelled } from './orderCancelled'
import { renderOrderShipped } from './orderShipped'
import { renderOrderDelivered } from './orderDelivered'
import { renderCheckoutAbandoned } from './checkoutAbandoned'
import { renderPrescriptionNextSteps } from './prescriptionNextSteps'
import { renderWaitlistVerify } from './waitlistVerify'
import { renderWaitlistConfirm } from './waitlistConfirm'
import { renderWaitlistAvailable } from './waitlistAvailable'
import { renderWaitlistReminder } from './waitlistReminder'
import { renderWaitlistUnsubscribed } from './waitlistUnsubscribed'
import { renderAdminAppointment } from './adminAppointment'
import { renderAdminNewOrder } from './adminNewOrder'
import { renderAdminOutOfStock } from './adminOutOfStock'
import { renderAdminWaitlistDigest } from './adminWaitlistDigest'
import { renderAdminPasswordReset } from './adminPasswordReset'
import { renderAdminPaymentAlert } from './adminPaymentAlert'

export {
  renderOrderPaid,
  renderOrderFailed,
  renderOrderCancelled,
  renderOrderShipped,
  renderOrderDelivered,
  renderCheckoutAbandoned,
  renderPrescriptionNextSteps,
  renderWaitlistVerify,
  renderWaitlistConfirm,
  renderWaitlistAvailable,
  renderWaitlistReminder,
  renderWaitlistUnsubscribed,
  renderAdminAppointment,
  renderAdminNewOrder,
  renderAdminOutOfStock,
  renderAdminWaitlistDigest,
  renderAdminPasswordReset,
  renderAdminPaymentAlert,
}

export type TemplateGroup = 'Compra' | 'Reserva' | 'Interno'

export type TemplateEntry = {
  /** Identificador estable. Sirve como nombre de archivo en la vista previa. */
  key: string
  title: string
  group: TemplateGroup
  /** Cuándo se dispara. Se muestra en el índice de la vista previa. */
  trigger: string
  /** Render con datos de ejemplo. */
  preview: () => EmailDoc
}

export const TEMPLATES: TemplateEntry[] = [
  {
    key: 'order-paid',
    title: 'Pago confirmado',
    group: 'Compra',
    trigger: 'Webhook Wompi APPROVED → pedido paid',
    preview: () => renderOrderPaid(S.SAMPLE_ORDER),
  },
  {
    key: 'order-failed',
    title: 'Pago rechazado',
    group: 'Compra',
    trigger: 'Webhook Wompi DECLINED → pedido failed',
    preview: () => renderOrderFailed(S.SAMPLE_FAILED),
  },
  {
    key: 'order-cancelled',
    title: 'Pedido anulado',
    group: 'Compra',
    trigger: 'Webhook Wompi VOIDED → pedido cancelled (devuelve unidades)',
    preview: () => renderOrderCancelled(S.SAMPLE_ORDER),
  },
  {
    key: 'order-shipped',
    title: 'Pedido enviado',
    group: 'Compra',
    trigger: 'El admin marca el pedido como shipped',
    preview: () => renderOrderShipped(S.SAMPLE_SHIPPED),
  },
  {
    key: 'order-delivered',
    title: 'Pedido entregado',
    group: 'Compra',
    trigger: 'El admin marca el pedido como delivered',
    preview: () => renderOrderDelivered(S.SAMPLE_DELIVERED),
  },
  {
    key: 'checkout-abandoned',
    title: 'Compra sin terminar',
    group: 'Compra',
    trigger: 'Pedido con más de 1 h en pending y sin webhook de aprobación',
    preview: () => renderCheckoutAbandoned(S.SAMPLE_ABANDONED),
  },
  {
    key: 'prescription-next-steps',
    title: 'Fórmula médica',
    group: 'Compra',
    trigger: 'Pago confirmado con líneas que exigen fórmula',
    preview: () => renderPrescriptionNextSteps(S.SAMPLE_PRESCRIPTION),
  },
  {
    key: 'waitlist-verify',
    title: 'Confirma tu correo',
    group: 'Reserva',
    trigger: 'Alguien se apunta a la lista (doble opt-in)',
    preview: () => renderWaitlistVerify(S.SAMPLE_WAITLIST_VERIFY),
  },
  {
    key: 'waitlist-confirm',
    title: 'Estás en la lista',
    group: 'Reserva',
    trigger: 'El correo queda verificado',
    preview: () => renderWaitlistConfirm(S.SAMPLE_WAITLIST),
  },
  {
    key: 'waitlist-available',
    title: 'Ya está disponible',
    group: 'Reserva',
    trigger: 'syncStockFromUnits(): stock pasa de 0 a >0',
    preview: () => renderWaitlistAvailable(S.SAMPLE_WAITLIST_AVAILABLE),
  },
  {
    key: 'waitlist-reminder',
    title: 'Últimas unidades',
    group: 'Reserva',
    trigger: 'Días después del aviso, si aún queda stock',
    preview: () => renderWaitlistReminder(S.SAMPLE_WAITLIST_REMINDER),
  },
  {
    key: 'waitlist-soldout',
    title: 'Se agotó otra vez',
    group: 'Reserva',
    trigger: 'Días después del aviso, si volvió a 0',
    preview: () => renderWaitlistReminder(S.SAMPLE_WAITLIST_SOLDOUT),
  },
  {
    key: 'waitlist-unsubscribed',
    title: 'Baja confirmada',
    group: 'Reserva',
    trigger: 'La persona usa el enlace de baja',
    preview: () => renderWaitlistUnsubscribed(S.SAMPLE_WAITLIST),
  },
  {
    key: 'admin-new-order',
    title: 'Nuevo pedido pagado',
    group: 'Interno',
    trigger: 'Mismo webhook que confirma el pago',
    preview: () => renderAdminNewOrder(S.SAMPLE_ADMIN_ORDER),
  },
  {
    key: 'admin-appointment',
    title: 'Cita para tomar la fórmula',
    group: 'Interno',
    trigger: 'requestAppointment(): alguien pide cita desde la ficha',
    preview: () => renderAdminAppointment(S.SAMPLE_ADMIN_APPOINTMENT),
  },
  {
    key: 'admin-out-of-stock',
    title: 'Modelo agotado',
    group: 'Interno',
    trigger: 'syncStockFromUnits(): stock pasa de >0 a 0',
    preview: () => renderAdminOutOfStock(S.SAMPLE_ADMIN_OUT_OF_STOCK),
  },
  {
    key: 'admin-waitlist-digest',
    title: 'Resumen de reservas',
    group: 'Interno',
    trigger: 'Cron semanal',
    preview: () => renderAdminWaitlistDigest(S.SAMPLE_ADMIN_DIGEST),
  },
  {
    key: 'admin-payment-alert',
    title: 'Alerta de pago',
    group: 'Interno',
    trigger: 'Pago aprobado que no encaja con el pedido (cobro duplicado, monto raro)',
    preview: () => renderAdminPaymentAlert(S.SAMPLE_ADMIN_PAYMENT_ALERT),
  },
  {
    key: 'admin-password-reset',
    title: 'Restablecer contraseña',
    group: 'Interno',
    trigger: 'El admin pide restablecer su clave',
    preview: () => renderAdminPasswordReset(S.SAMPLE_ADMIN_RESET),
  },
]
