'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '../ui/Icon'
import { useDict } from '../../i18n/useDict'
import type { AppointmentRow } from '../../server/appointments'

const STATUSES = ['pending', 'scheduled', 'done', 'cancelled'] as const
type Status = (typeof STATUSES)[number]

/**
 * La cola de citas para tomar la fórmula.
 *
 * Cada fila es alguien que quiso comprar y no pudo porque no tenía su
 * graduación: son los contactos más calientes del sistema, más que una reserva
 * de stock. Por eso la acción principal de cada fila es el WhatsApp con el
 * saludo ya escrito, y no "ver detalle".
 *
 * El estado se cambia aquí porque nada lo puede mover solo: no hay ningún
 * evento del sistema que sepa que alguien fue a la óptica. Sin ese cierre
 * manual, la cola crece para siempre y deja de servir para saber qué falta.
 *
 * Se usa desde el teléfono: fichas hasta `md` y tabla de ahí para arriba, como
 * el resto del panel. Ninguna tabla con scroll horizontal.
 */
export function AppointmentsView({ rows }: { rows: AppointmentRow[] }) {
  const { t } = useDict()
  const a = t.admin.appointments
  const router = useRouter()
  const [saving, setSaving] = useState<string | null>(null)

  const label = (s: string) =>
    s === 'pending' ? a.pending : s === 'scheduled' ? a.scheduled : s === 'done' ? a.done : a.cancelled

  async function setStatus(id: string, status: Status) {
    setSaving(id)
    try {
      const res = await fetch('/api/admin/citas', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) throw new Error('request failed')
      router.refresh()
    } catch (err) {
      console.error('[admin/citas] no se pudo cambiar el estado:', err)
    } finally {
      setSaving(null)
    }
  }

  const date = (iso: string) =>
    new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })

  if (rows.length === 0) {
    return (
      <section>
        <h1 className="font-head text-2xl text-warm-white">{a.title}</h1>
        <p className="mt-2 text-warm-gray/65">{a.subtitle}</p>
        <p className="mt-8 text-warm-gray/50">{a.empty}</p>
      </section>
    )
  }

  const StatusSelect = ({ row }: { row: AppointmentRow }) => (
    <select
      value={row.status}
      disabled={saving === row.id}
      onChange={(e) => setStatus(row.id, e.target.value as Status)}
      className="rounded-md border border-line bg-carbon-900 px-2 py-2 text-base text-warm-white outline-none focus:border-gold/60 disabled:opacity-50 md:py-1.5 md:text-sm"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {label(s)}
        </option>
      ))}
    </select>
  )

  const WhatsappLink = ({ row }: { row: AppointmentRow }) => (
    <a
      href={row.whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm text-gold/90 transition-colors hover:text-gold"
    >
      <Icon name="whatsapp" size={15} />
      {row.phoneDisplay}
    </a>
  )

  return (
    <section>
      <h1 className="font-head text-2xl text-warm-white">{a.title}</h1>
      <p className="mt-2 text-warm-gray/65">{a.subtitle}</p>

      {/* Fichas en móvil. */}
      <div className="mt-6 space-y-3 md:hidden">
        {rows.map((row) => (
          <article key={row.id} className="rounded-xl border border-line p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="font-head text-warm-white">{row.name}</span>
              <span className="font-mono text-[0.65rem] tracking-widest text-warm-gray/45">
                {date(row.createdAt)}
              </span>
            </div>
            <div className="mt-1.5">
              <WhatsappLink row={row} />
            </div>
            <p className="mt-1.5 text-sm text-warm-gray/65">
              {[row.productName, row.lensName, row.city, row.preferredTime]
                .filter(Boolean)
                .join(' · ') || '—'}
            </p>
            {row.note && <p className="mt-1.5 text-sm text-warm-gray/50">{row.note}</p>}
            <div className="mt-3">
              <StatusSelect row={row} />
            </div>
          </article>
        ))}
      </div>

      {/* Tabla desde `md`. */}
      <div className="mt-6 hidden md:block">
        <table className="w-full text-left text-sm">
          <thead className="font-mono text-[0.65rem] tracking-widest text-warm-gray/45 uppercase">
            <tr className="border-b border-line">
              <th className="py-2 pr-3">{a.colName}</th>
              <th className="py-2 pr-3">{a.colPhone}</th>
              <th className="py-2 pr-3">{a.colModel}</th>
              <th className="py-2 pr-3">{a.colWhen}</th>
              <th className="py-2 pr-3">{a.colDate}</th>
              <th className="py-2">{a.colStatus}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-line/60">
                <td className="py-3 pr-3 text-warm-white">
                  {row.name}
                  {row.city && (
                    <span className="ml-2 text-xs text-warm-gray/45">{row.city}</span>
                  )}
                </td>
                <td className="py-3 pr-3">
                  <WhatsappLink row={row} />
                </td>
                <td className="py-3 pr-3 text-warm-gray/70">
                  {row.productName ?? '—'}
                  {row.lensName && (
                    <span className="ml-2 text-xs text-gold/70">{row.lensName}</span>
                  )}
                </td>
                <td className="py-3 pr-3 text-warm-gray/70">{row.preferredTime ?? '—'}</td>
                <td className="py-3 pr-3 font-mono text-xs text-warm-gray/45">
                  {date(row.createdAt)}
                </td>
                <td className="py-3">
                  <StatusSelect row={row} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
