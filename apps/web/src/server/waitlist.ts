import { randomBytes } from 'node:crypto'
import { getDb } from './db'
import { normalizePhone } from '../lib/phone'
import { AxisStockAlert, type StockAlertSource } from './db/entities/StockAlert'
import { AxisProduct } from './db/entities/Product'
import { AxisProductImage } from './db/entities/ProductImage'
import { cdnUrl } from '../lib/cdn'
import type { StockAlertDTO, StockAlertSourceDTO, StockAlertStatusDTO } from '../lib/waitlist'
import { idempotencyKeyFrom, sendEmail, sendToAdmin } from './email/brevo'
import { siteUrl } from './email/format'
import {
  renderAdminOutOfStock,
  renderWaitlistAvailable,
  renderWaitlistConfirm,
  renderWaitlistUnsubscribed,
  renderWaitlistVerify,
} from './email/templates'

/**
 * Reservas: "avísame cuando esté disponible".
 *
 * El disparador vive en el inventario — `syncStockFromUnits()` devuelve las
 * transiciones de stock y `handleStockTransitions()` las convierte en correos.
 * Nunca al revés: el inventario no sabe que existe el correo.
 *
 * Todo el envío es best-effort. Guardar la reserva y avisar son operaciones
 * distintas: si Brevo no está configurado (hoy no lo está), las reservas se
 * siguen guardando y el aviso se puede disparar a mano desde el panel el día
 * que haya cuenta.
 *
 * **El dato obligatorio es el WhatsApp, no el correo** (migración `...011`).
 * Eso parte el aviso en dos caminos que conviene no mezclar:
 *  - con correo → aviso automático por Brevo, con confirmación y baja por token;
 *  - sin correo → no hay nada que automatizar; queda en el panel para que
 *    alguien le escriba por WhatsApp.
 * Por eso `notifyProductAvailable()` devuelve las dos cifras y solo marca como
 * `notified` a quien de verdad recibió un correo.
 */

const VERIFY_EXPIRES_HOURS = 48

/**
 * Doble opt-in: apagado por defecto.
 *
 * Con Brevo sin configurar, exigir confirmación por correo dejaría a todo el
 * mundo en `pending` para siempre — nadie recibiría el correo con el que
 * confirmar, y la lista quedaría inservible justo en la etapa en la que más
 * importa. Se enciende con `WAITLIST_DOUBLE_OPT_IN=true` cuando el dominio esté
 * verificado y empiece a llegar correo basura.
 */
function doubleOptIn(): boolean {
  return process.env.WAITLIST_DOUBLE_OPT_IN === 'true'
}

function newToken(): string {
  return randomBytes(24).toString('base64url')
}

const productUrl = (slug: string) => siteUrl(`/tienda/${slug}`)
const unsubscribeUrl = (token: string) => siteUrl(`/api/reservas/baja?token=${token}`)
const verifyUrl = (token: string) => siteUrl(`/api/reservas/confirmar?token=${token}`)

/** Portada del producto como URL absoluta de CloudFront (o null). */
async function coverUrl(productId: string): Promise<string | null> {
  const db = await getDb()
  const image = await db.getRepository(AxisProductImage).findOne({
    where: { productId },
    order: { position: 'ASC' },
  })
  if (!image?.imageKey) return null
  const url = cdnUrl(image.imageKey)
  return url.startsWith('http') ? url : null
}

// ---------- Alta ----------

export type SubscribeInput = {
  productId: string
  name: string
  phone: string
  /** Opcional: sin él, la reserva se atiende a mano por WhatsApp. */
  email?: string | null
  source: StockAlertSource
  locale?: string
}

export type SubscribeOutcome =
  /** Queda en espera y se le avisará. */
  | { ok: true; status: 'active' }
  /** Le mandamos un correo para que confirme (doble opt-in). */
  | { ok: true; status: 'pending' }
  /** Ya estaba apuntado a este modelo. */
  | { ok: true; status: 'already' }
  | { ok: false; code: 'PRODUCT_NOT_FOUND'; message: string }
  | { ok: false; code: 'INVALID_PHONE'; message: string }

/**
 * Apunta a alguien a la lista de espera de un producto.
 *
 * Idempotente por (producto, teléfono): volver a apuntarse reactiva la fila que
 * ya existe. Eso incluye a quien se había dado de baja — si vuelve por su
 * propia voluntad, vuelve a entrar.
 *
 * El teléfono se normaliza AQUÍ además de en el formulario: el endpoint es
 * público y nadie garantiza que la petición venga de nuestro navegador.
 */
export async function subscribeToStockAlert(input: SubscribeInput): Promise<SubscribeOutcome> {
  const db = await getDb()
  const phone = normalizePhone(input.phone)
  if (!phone) {
    return { ok: false, code: 'INVALID_PHONE', message: 'Escribe un número de WhatsApp válido.' }
  }
  const name = input.name.trim().slice(0, 120) || null
  const email = input.email?.trim().toLowerCase() || null

  const product = await db.getRepository(AxisProduct).findOne({
    where: { id: input.productId, active: true },
  })
  if (!product) {
    return { ok: false, code: 'PRODUCT_NOT_FOUND', message: 'Ese modelo no existe.' }
  }

  const repo = db.getRepository(AxisStockAlert)
  // El teléfono manda, pero el correo también identifica: quien se apuntó con
  // correo y vuelve desde otro número es la misma persona, y sin este segundo
  // findOne el índice único del correo lo convertiría en un 23505.
  const existing =
    (await repo.findOne({ where: { productId: product.id, phone } })) ??
    (email ? await repo.findOne({ where: { productId: product.id, email } }) : null)
  // Sin correo no hay a dónde mandar la confirmación: el doble opt-in no aplica.
  const status = doubleOptIn() && email ? 'pending' : 'active'

  if (existing) {
    // Los datos de contacto se refrescan siempre, incluso si ya estaba en la
    // lista: si volvió a apuntarse dejando ahora sí un correo, o corrigiendo el
    // número, lo último que escribió es lo bueno.
    existing.name = name ?? existing.name
    existing.phone = phone
    existing.email = email ?? existing.email

    // Ya avisado o dado de baja: se reabre. En espera: no se toca (ni se le
    // manda otro correo de confirmación por insistir con el formulario).
    if (existing.status === 'active' || existing.status === 'pending') {
      await repo.save(existing)
      return { ok: true, status: 'already' }
    }
    existing.status = status
    existing.source = input.source
    existing.token = newToken()
    existing.unsubscribedAt = null
    existing.notifiedAt = null
    if (status === 'active') existing.verifiedAt = new Date()
    await repo.save(existing)
    await sendSubscribeEmail(existing.token, status, product.name, product.slug, existing.email)
    return { ok: true, status }
  }

  const alert = repo.create({
    productId: product.id,
    name,
    phone,
    email,
    status,
    source: input.source,
    locale: input.locale === 'en' ? 'en' : 'es',
    token: newToken(),
    verifiedAt: status === 'active' ? new Date() : null,
  })
  try {
    await repo.save(alert)
  } catch (err) {
    // Doble clic en el botón: los dos requests pasaron el findOne y los dos
    // insertan. El índice único (productId, phone) hace su trabajo y aquí se
    // traduce a "ya estabas apuntado" en vez de a un 500.
    if ((err as { code?: string })?.code === '23505') return { ok: true, status: 'already' }
    throw err
  }
  await sendSubscribeEmail(alert.token, status, product.name, product.slug, email)
  return { ok: true, status }
}

async function sendSubscribeEmail(
  token: string,
  status: 'active' | 'pending',
  productName: string,
  slug: string,
  email: string | null,
): Promise<void> {
  // Reserva sin correo: no hay nada que mandar. El aviso lo dará una persona
  // por WhatsApp desde /admin/reservas.
  if (!email) return
  const base = {
    email,
    productName,
    productUrl: productUrl(slug),
    imageUrl: null,
    unsubscribeUrl: unsubscribeUrl(token),
  }
  const doc =
    status === 'pending'
      ? renderWaitlistVerify({ ...base, verifyUrl: verifyUrl(token), expiresHours: VERIFY_EXPIRES_HOURS })
      : renderWaitlistConfirm(base)
  await sendEmail({ email }, doc, {
    tags: ['reserva', status === 'pending' ? 'verificacion' : 'confirmacion'],
    stream: 'list',
    idempotencyKey: idempotencyKeyFrom(`reserva-alta:${token}`),
  })
}

// ---------- Confirmación y baja ----------

/** Confirma el correo (doble opt-in). Devuelve false si el token no sirve. */
export async function verifyStockAlert(token: string): Promise<boolean> {
  const db = await getDb()
  const repo = db.getRepository(AxisStockAlert)
  const alert = await repo.findOne({ where: { token } })
  if (!alert || alert.status !== 'pending') return false

  alert.status = 'active'
  alert.verifiedAt = new Date()
  await repo.save(alert)

  const product = await db.getRepository(AxisProduct).findOne({ where: { id: alert.productId } })
  if (product && alert.email) {
    await sendEmail(
      { email: alert.email },
      renderWaitlistConfirm({
        email: alert.email,
        productName: product.name,
        productUrl: productUrl(product.slug),
        imageUrl: null,
        unsubscribeUrl: unsubscribeUrl(alert.token),
      }),
      { tags: ['reserva', 'confirmacion'], stream: 'list' },
    )
  }
  return true
}

/** Da de baja por token. Idempotente: un segundo clic no falla. */
export async function unsubscribeStockAlert(token: string): Promise<boolean> {
  const db = await getDb()
  const repo = db.getRepository(AxisStockAlert)
  const alert = await repo.findOne({ where: { token } })
  if (!alert) return false
  if (alert.status === 'unsubscribed') return true

  alert.status = 'unsubscribed'
  alert.unsubscribedAt = new Date()
  await repo.save(alert)

  const product = await db.getRepository(AxisProduct).findOne({ where: { id: alert.productId } })
  if (product && alert.email) {
    await sendEmail(
      { email: alert.email },
      renderWaitlistUnsubscribed({
        email: alert.email,
        productName: product.name,
        productUrl: productUrl(product.slug),
        imageUrl: null,
        unsubscribeUrl: unsubscribeUrl(alert.token),
      }),
      { tags: ['reserva', 'baja'], stream: 'list' },
    )
  }
  return true
}

// ---------- Aviso de disponibilidad ----------

export type NotifyResult = {
  /** Correos enviados. */
  sent: number
  /** Reservas sin correo: quedan en espera de un WhatsApp escrito a mano. */
  pendingWhatsapp: number
}

/**
 * Avisa por correo a toda la lista activa de un producto y las marca como
 * notificadas.
 *
 * Las reservas SIN correo no se pueden avisar desde aquí y por eso **siguen en
 * `active`**: marcarlas como notificadas sería mentir y las escondería del
 * panel justo cuando toca escribirles. Se devuelven contadas en
 * `pendingWhatsapp` para que el panel diga cuántas quedan a mano.
 *
 * Se manda de a pocos a propósito: Brevo limita el ritmo, y una ráfaga de 200
 * peticiones en paralelo se traduce en 429 y avisos perdidos.
 */
export async function notifyProductAvailable(productId: string): Promise<NotifyResult> {
  const empty: NotifyResult = { sent: 0, pendingWhatsapp: 0 }
  const db = await getDb()
  const product = await db.getRepository(AxisProduct).findOne({ where: { id: productId } })
  if (!product) return empty

  const repo = db.getRepository(AxisStockAlert)
  const all = await repo.find({ where: { productId, status: 'active' }, order: { createdAt: 'ASC' } })
  const alerts = all.filter((a): a is AxisStockAlert & { email: string } => Boolean(a.email))
  const pendingWhatsapp = all.length - alerts.length
  if (alerts.length === 0) return { sent: 0, pendingWhatsapp }

  const image = await coverUrl(productId)
  let sent = 0

  const CHUNK = 5
  for (let i = 0; i < alerts.length; i += CHUNK) {
    const chunk = alerts.slice(i, i + CHUNK)
    const results = await Promise.allSettled(
      chunk.map((alert) =>
        sendEmail(
          { email: alert.email },
          renderWaitlistAvailable({
            email: alert.email,
            productName: product.name,
            productUrl: productUrl(product.slug),
            imageUrl: image,
            unsubscribeUrl: unsubscribeUrl(alert.token),
            priceCop: product.priceCop,
            compareAtPriceCop: product.compareAtPriceCop,
            unitsLeft: product.stock,
            holdHours: null,
          }),
          {
            tags: ['reserva', 'disponible'],
            stream: 'list',
            // Determinista por reserva: si este aviso se dispara dos veces
            // seguidas (inventario que baila, doble clic en el panel), Brevo
            // descarta el segundo y nadie recibe el correo repetido.
            idempotencyKey: idempotencyKeyFrom(`reserva-disponible:${alert.id}`),
          },
        ),
      ),
    )
    results.forEach((r) => {
      if (r.status === 'fulfilled' && r.value.ok) sent += 1
    })
  }

  // Se marcan como notificadas aunque el envío haya fallado o Brevo no esté
  // configurado: si no, el siguiente movimiento de inventario reintentaría con
  // toda la lista y quien SÍ recibió el aviso lo recibiría dos veces. Solo las
  // que tienen correo: a las demás no se les ha avisado de nada.
  await repo
    .createQueryBuilder()
    .update(AxisStockAlert)
    .set({ status: 'notified', notifiedAt: new Date() })
    .where('"productId" = :productId', { productId })
    .andWhere('status = :status', { status: 'active' })
    .andWhere('email IS NOT NULL')
    .execute()

  console.info(
    `[reservas] ${product.name}: ${sent}/${alerts.length} avisos enviados` +
      (pendingWhatsapp ? `, ${pendingWhatsapp} por WhatsApp a mano` : ''),
  )
  return { sent, pendingWhatsapp }
}

/**
 * Marca UNA reserva como avisada, sin mandar nada.
 *
 * Es el cierre del camino manual: la persona no dejó correo, alguien le escribió
 * por WhatsApp desde el panel y hay que sacarla de "en espera". Sin esto, las
 * reservas sin correo se quedarían activas para siempre y el contador del panel
 * pediría avisar a gente ya avisada.
 */
export async function markAlertNotified(id: string): Promise<boolean> {
  const db = await getDb()
  const repo = db.getRepository(AxisStockAlert)
  const alert = await repo.findOne({ where: { id } })
  if (!alert) return false
  if (alert.status === 'notified') return true

  alert.status = 'notified'
  alert.notifiedAt = new Date()
  await repo.save(alert)
  return true
}

/**
 * Convierte las transiciones de stock que devuelve `syncStockFromUnits()` en
 * correos: 0 → >0 avisa a la lista; >0 → 0 avisa al equipo.
 *
 * No lanza nunca: se llama desde el webhook de Wompi y desde el panel, y un
 * fallo de correo no puede tumbar ninguno de los dos.
 */
export async function handleStockTransitions(
  transitions: Map<string, { stock: number; previous: number }>,
): Promise<void> {
  for (const [productId, { stock, previous }] of transitions) {
    try {
      if (previous === 0 && stock > 0) {
        await notifyProductAvailable(productId)
      } else if (previous > 0 && stock === 0) {
        await notifyAdminOutOfStock(productId)
      }
    } catch (err) {
      console.error('[reservas] fallo procesando transición de stock:', err)
    }
  }
}

async function notifyAdminOutOfStock(productId: string): Promise<void> {
  const db = await getDb()
  const product = await db.getRepository(AxisProduct).findOne({ where: { id: productId } })
  if (!product) return
  const waitingCount = await db
    .getRepository(AxisStockAlert)
    .count({ where: { productId, status: 'active' } })

  await sendToAdmin(
    renderAdminOutOfStock({
      productName: product.name,
      modelCode: product.modelCode,
      waitingCount,
      adminUrl: siteUrl('/admin/inventario'),
    }),
    {
      tags: ['inventario', 'agotado'],
      idempotencyKey: idempotencyKeyFrom(`inventario-agotado:${productId}`),
    },
  )
}

// ---------- Consultas para el panel ----------

/** Todas las reservas, de la más nueva a la más vieja. */
export async function listStockAlerts(): Promise<StockAlertDTO[]> {
  const db = await getDb()
  const rows = await db
    .getRepository(AxisStockAlert)
    .createQueryBuilder('a')
    .innerJoin(AxisProduct, 'p', 'p.id = a."productId"')
    .select([
      'a.id AS id',
      'a.name AS name',
      'a.phone AS phone',
      'a.email AS email',
      'a.status AS status',
      'a.source AS source',
      'a."productId" AS "productId"',
      'p.name AS "productName"',
      'p.slug AS "productSlug"',
      'p.stock AS stock',
      'a."createdAt" AS "createdAt"',
      'a."notifiedAt" AS "notifiedAt"',
    ])
    .orderBy('a."createdAt"', 'DESC')
    .getRawMany<{
      id: string
      name: string | null
      phone: string | null
      email: string | null
      status: StockAlertStatusDTO
      source: StockAlertSourceDTO
      productId: string
      productName: string
      productSlug: string
      stock: number
      createdAt: Date
      notifiedAt: Date | null
    }>()

  return rows.map((r) => ({
    ...r,
    stock: Number(r.stock),
    createdAt: r.createdAt.toISOString(),
    notifiedAt: r.notifiedAt ? r.notifiedAt.toISOString() : null,
  }))
}

/** Cuánta gente espera cada producto (solo las que siguen en espera). */
export async function waitlistCounts(): Promise<Map<string, number>> {
  const db = await getDb()
  const rows = await db
    .getRepository(AxisStockAlert)
    .createQueryBuilder('a')
    .select('a."productId"', 'productId')
    .addSelect('COUNT(*)', 'count')
    .where('a.status = :status', { status: 'active' })
    .groupBy('a."productId"')
    .getRawMany<{ productId: string; count: string }>()
  return new Map(rows.map((r) => [r.productId, Number(r.count)]))
}
