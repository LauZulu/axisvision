'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDict } from '../../i18n/useDict'
import { formatDateTime } from '../../lib/format'
import type { StockAlertDTO } from '../../lib/waitlist'

/**
 * Reservas del panel. Dos vistas de lo mismo:
 *  - arriba, cuánta gente espera cada modelo → decide qué reponer primero;
 *  - abajo, la lista de correos.
 *
 * El botón "avisar ahora" existe para el caso concreto de esta etapa: cuando
 * lleguen las gafas y se configure Wompi, hay que escribirle a la gente que se
 * apuntó con la tienda cerrada, y esa transición de stock quizá ya ocurrió.
 */
export function WaitlistView({ alerts }: { alerts: StockAlertDTO[] }) {
  const { t } = useDict()
  const w = t.admin.waitlist
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [sent, setSent] = useState<Record<string, number>>({})

  // Un resumen por modelo, contando solo a quien sigue esperando.
  const byProduct = new Map<
    string,
    { productId: string; productName: string; stock: number; waiting: number; total: number }
  >()
  for (const a of alerts) {
    const row = byProduct.get(a.productId) ?? {
      productId: a.productId,
      productName: a.productName,
      stock: a.stock,
      waiting: 0,
      total: 0,
    }
    row.total += 1
    if (a.status === 'active') row.waiting += 1
    byProduct.set(a.productId, row)
  }
  const summary = [...byProduct.values()].sort((a, b) => b.waiting - a.waiting)

  async function notify(productId: string) {
    setBusy(productId)
    try {
      const res = await fetch('/api/admin/reservas', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ productId }),
      })
      const data = (await res.json().catch(() => ({}))) as { sent?: number }
      setSent((s) => ({ ...s, [productId]: data.sent ?? 0 }))
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  const statusLabel: Record<string, string> = {
    active: w.statusActive,
    pending: w.statusPending,
    notified: w.statusNotified,
    unsubscribed: w.statusUnsubscribed,
  }

  return (
    <div>
      <h1 className="font-head text-xl text-warm-white sm:text-2xl">{w.title}</h1>
      <p className="mt-1 text-sm text-warm-gray/60 sm:text-base">{w.subtitle}</p>

      {alerts.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-line bg-carbon-850 p-6 text-warm-gray/60 sm:mt-8 sm:p-8">
          {w.empty}
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 lg:grid-cols-3">
            {summary.map((row) => (
              <div key={row.productId} className="rounded-2xl border border-line bg-carbon-850 p-4 sm:p-5">
                <h2 className="font-head text-warm-white">{row.productName}</h2>
                <p className="mt-1 font-mono text-xs tracking-widest text-warm-gray/55">
                  {w.stock}: {row.stock}
                </p>
                <p className="mt-4 font-head text-3xl text-gold">{row.waiting}</p>
                <p className="text-xs text-warm-gray/55">{w.waiting}</p>
                <button
                  type="button"
                  onClick={() => notify(row.productId)}
                  disabled={busy === row.productId || row.waiting === 0}
                  className="mt-4 w-full rounded-md border border-gold/40 px-4 py-2 font-head text-sm text-warm-white transition-colors hover:border-gold hover:text-gold disabled:opacity-40"
                >
                  {busy === row.productId ? w.notifying : w.notifyNow}
                </button>
                {sent[row.productId] !== undefined && (
                  <p className="mt-2 text-xs text-warm-gray/55">
                    {w.notifyResult.replace('{n}', String(sent[row.productId]))}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Móvil: una ficha por correo apuntado */}
          <ul className="mt-6 space-y-3 md:hidden">
            {alerts.map((a) => (
              <li key={a.id} className="rounded-2xl border border-line bg-carbon-850 p-4">
                <div className="break-all text-sm text-warm-white">{a.email}</div>
                <div className="mt-1 text-sm text-warm-gray/70">{a.productName}</div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-warm-gray/50">
                  <span className="text-warm-gray/75">{statusLabel[a.status] ?? a.status}</span>
                  <span>·</span>
                  <span>{a.source === 'preview' ? w.sourcePreview : w.sourceSoldOut}</span>
                  <span>·</span>
                  <span>{formatDateTime(a.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 hidden overflow-x-auto rounded-2xl border border-line md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-carbon-850 text-warm-gray/55">
                <tr>
                  <th className="px-4 py-3 font-mono text-xs uppercase tracking-widest">{w.colEmail}</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase tracking-widest">{w.colProduct}</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase tracking-widest">{w.colSource}</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase tracking-widest">{w.colStatus}</th>
                  <th className="px-4 py-3 font-mono text-xs uppercase tracking-widest">{w.colDate}</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 text-warm-white">{a.email}</td>
                    <td className="px-4 py-3 text-warm-gray/80">{a.productName}</td>
                    <td className="px-4 py-3 text-warm-gray/60">
                      {a.source === 'preview' ? w.sourcePreview : w.sourceSoldOut}
                    </td>
                    <td className="px-4 py-3 text-warm-gray/80">{statusLabel[a.status] ?? a.status}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-warm-gray/60">
                      {formatDateTime(a.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
