import { getDb } from './db'
import { formatPhone, normalizePhone, whatsappTo } from '../lib/phone'
import { AxisAppointment, type AppointmentSource } from './db/entities/Appointment'
import { AxisProduct } from './db/entities/Product'
import { AxisLensOption } from './db/entities/LensOption'
import { sendToAdmin } from './email/brevo'
import { siteUrl } from './email/format'
import { renderAdminAppointment } from './email/templates'

/**
 * Citas para tomar la fórmula.
 *
 * Es la salida del primer paso del configurador: "¿tienes tu fórmula a la
 * mano?" → no. Sin esto, quien no la tiene se queda mirando un formulario que
 * no puede llenar, y la única alternativa era irse.
 *
 * El aviso al equipo es **best-effort**, igual que en las reservas: guardar la
 * cita y avisar son operaciones distintas, y hoy Brevo no está configurado. Si
 * el correo falla, la cita ya está en la DB y sale en `/admin/citas` — perder
 * el registro por no poder mandar un correo sería el peor de los dos fallos.
 */

export type AppointmentInput = {
  productId?: string | null
  lensOptionId?: string | null
  name: string
  phone: string
  email?: string | null
  city?: string | null
  preferredTime?: string | null
  note?: string | null
  source?: AppointmentSource
  locale?: string
}

export type AppointmentOutcome =
  | { ok: true; id: string; whatsappUrl: string }
  | { ok: false; code: 'INVALID_PHONE'; message: string }

/**
 * Registra la cita. El teléfono se normaliza AQUÍ además de en el formulario:
 * el endpoint es público y nadie garantiza que la petición venga de nuestro
 * navegador (misma regla que en `subscribeToStockAlert`).
 *
 * No es idempotente por teléfono a propósito, al revés que las reservas: pedir
 * dos citas es una situación real (otro modelo, otro día) y colapsarlas
 * borraría la segunda petición sin que nadie se entere.
 */
export async function requestAppointment(input: AppointmentInput): Promise<AppointmentOutcome> {
  const db = await getDb()
  const phone = normalizePhone(input.phone)
  if (!phone) {
    return { ok: false, code: 'INVALID_PHONE', message: 'Escribe un número de WhatsApp válido.' }
  }

  const name = input.name.trim().slice(0, 120)
  const email = input.email?.trim().toLowerCase() || null

  // El modelo y el lente son contexto, no requisitos: una cita vale igual sin
  // ellos. Si el id no existe (catálogo cambiado, petición manipulada) se
  // guarda la cita sin él en vez de rechazarla — el dato que importa es el
  // teléfono.
  const product = input.productId
    ? await db.getRepository(AxisProduct).findOne({ where: { id: input.productId } })
    : null
  const lens = input.lensOptionId
    ? await db.getRepository(AxisLensOption).findOne({ where: { id: input.lensOptionId } })
    : null

  const repo = db.getRepository(AxisAppointment)
  const saved = await repo.save(
    repo.create({
      productId: product?.id ?? null,
      lensOptionId: lens?.id ?? null,
      name,
      phone,
      email,
      city: input.city?.trim().slice(0, 120) || null,
      preferredTime: input.preferredTime?.trim().slice(0, 200) || null,
      note: input.note?.trim() || null,
      status: 'pending',
      source: input.source ?? 'product',
      locale: input.locale ?? 'es',
    }),
  )

  const greeting = product
    ? `Hola ${name.split(' ')[0]}, te escribimos de AXIS Vision por tu cita para tomarte la fórmula (${product.name}).`
    : `Hola ${name.split(' ')[0]}, te escribimos de AXIS Vision por tu cita para tomarte la fórmula.`
  const whatsappUrl = whatsappTo(phone, greeting)

  try {
    await sendToAdmin(
      renderAdminAppointment({
        name,
        phoneDisplay: formatPhone(phone),
        whatsappUrl,
        productName: product?.name ?? null,
        lensName: lens?.nameEs ?? null,
        city: input.city?.trim() || null,
        preferredTime: input.preferredTime?.trim() || null,
        note: input.note?.trim() || null,
        adminUrl: siteUrl('/admin/citas'),
      }),
      { tags: ['appointment'] },
    )
  } catch (err) {
    // La cita ya está guardada: el fallo del correo no puede tumbar la
    // respuesta al cliente, que vería un error después de haber dejado bien
    // sus datos y probablemente los volvería a mandar.
    console.error('[citas] no se pudo avisar al equipo:', err)
  }

  return { ok: true, id: saved.id, whatsappUrl }
}

// ---------- Panel ----------

export type AppointmentRow = {
  id: string
  productName: string | null
  lensName: string | null
  name: string
  phone: string
  phoneDisplay: string
  whatsappUrl: string
  email: string | null
  city: string | null
  preferredTime: string | null
  note: string | null
  status: string
  createdAt: string
}

/** La cola de citas, las pendientes primero (que son las que hay que atender). */
export async function listAppointments(): Promise<AppointmentRow[]> {
  const db = await getDb()
  const rows = await db.getRepository(AxisAppointment).find({
    relations: { product: true },
    order: { createdAt: 'DESC' },
  })

  // Los nombres de lente se resuelven en bloque: son cinco filas y hacerlo con
  // una relación por cita traería el catálogo entero una vez por fila.
  const lensIds = [...new Set(rows.map((r) => r.lensOptionId).filter(Boolean))] as string[]
  const lenses = lensIds.length
    ? await db.getRepository(AxisLensOption).findByIds(lensIds)
    : []
  const lensById = new Map(lenses.map((l) => [l.id, l.nameEs]))

  const order = { pending: 0, scheduled: 1, done: 2, cancelled: 3 } as Record<string, number>
  return rows
    .map((r) => ({
      id: r.id,
      productName: r.product?.name ?? null,
      lensName: r.lensOptionId ? (lensById.get(r.lensOptionId) ?? null) : null,
      name: r.name,
      phone: r.phone,
      phoneDisplay: formatPhone(r.phone),
      whatsappUrl: whatsappTo(
        r.phone,
        `Hola ${r.name.split(' ')[0]}, te escribimos de AXIS Vision por tu cita para tomarte la fórmula.`,
      ),
      email: r.email,
      city: r.city,
      preferredTime: r.preferredTime,
      note: r.note,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }))
    .sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9))
}

/** Mueve una cita de estado desde el panel. */
export async function setAppointmentStatus(
  id: string,
  status: 'pending' | 'scheduled' | 'done' | 'cancelled',
): Promise<boolean> {
  const db = await getDb()
  const result = await db.getRepository(AxisAppointment).update({ id }, { status })
  return (result.affected ?? 0) > 0
}
