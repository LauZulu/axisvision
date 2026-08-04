'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCop } from '../../lib/products'
import { formatDateTime } from '../../lib/format'
import { useDict } from '../../i18n/useDict'
import { ORDER_STATUSES, type OrderDTO, type OrderStatus } from '../../lib/orders'

export function OrderTable({ orders }: { orders: OrderDTO[] }) {
  const { t } = useDict()
  const o2 = t.admin.orders
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  async function changeStatus(o: OrderDTO, status: OrderStatus) {
    setBusy(o.id)
    await fetch(`/api/admin/orders/${o.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setBusy(null)
    router.refresh()
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-carbon-850 p-6 text-warm-gray/60 sm:p-8">
        {o2.empty}
      </div>
    )
  }

  // `text-base` en el select: por debajo de 16px Safari de iOS hace zoom al
  // desplegarlo y deja la página descuadrada.
  const statusSelect = (o: OrderDTO, extra = '') => (
    <select
      value={o.status}
      disabled={busy === o.id}
      onChange={(e) => changeStatus(o, e.target.value as OrderStatus)}
      aria-label={o2.colStatus}
      className={`rounded-md border border-line bg-carbon-900 px-2 py-2 text-base text-warm-white outline-none focus:border-gold/60 disabled:opacity-50 md:py-1.5 md:text-sm ${extra}`}
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s} value={s}>
          {t.admin.orderStatus[s]}
        </option>
      ))}
    </select>
  )

  const itemsSummary = (o: OrderDTO) => o.items.map((it) => `${it.quantity}× ${it.productName}`).join(', ')

  return (
    <>
      {/* Móvil: una ficha por pedido, con el estado editable a ancho completo */}
      <ul className="space-y-3 md:hidden">
        {orders.map((o) => (
          <li key={o.id} className="rounded-2xl border border-line bg-carbon-850 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-mono text-sm text-warm-white">{o.reference}</div>
                <div className="font-mono text-xs text-warm-gray/45">
                  {formatDateTime(o.createdAt)}
                </div>
              </div>
              <div className="shrink-0 font-head text-warm-white">{formatCop(o.amountCop)}</div>
            </div>

            <div className="mt-3 border-t border-line/60 pt-3 text-sm">
              <div className="truncate text-warm-white">{o.customerName}</div>
              <div className="truncate text-xs text-warm-gray/50">{o.customerEmail}</div>
              {o.customerPhone && (
                <div className="text-xs text-warm-gray/40">{o.customerPhone}</div>
              )}
            </div>

            <div className="mt-3 text-xs text-warm-gray/55">
              <span className="font-mono text-warm-gray/70">{o.itemsCount}</span> · {itemsSummary(o)}
            </div>

            <label className="mt-4 block">
              <span className="mb-1.5 block font-mono text-[0.6rem] uppercase tracking-widest text-warm-gray/45">
                {o2.colStatus}
              </span>
              {statusSelect(o, 'w-full')}
            </label>
          </li>
        ))}
      </ul>

      {/* Escritorio: tabla */}
      <div className="hidden overflow-x-auto rounded-2xl border border-line md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-carbon-850 text-warm-gray/55">
            <tr>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-widest">{o2.colOrder}</th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-widest">{o2.colCustomer}</th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-widest">{o2.colItems}</th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-widest">{o2.colTotal}</th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-widest">{o2.colStatus}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-line/60 align-top last:border-0">
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="font-mono text-warm-white">{o.reference}</div>
                  <div className="font-mono text-xs text-warm-gray/45">
                    {formatDateTime(o.createdAt)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-warm-white">{o.customerName}</div>
                  <div className="text-xs text-warm-gray/50">{o.customerEmail}</div>
                  {o.customerPhone && <div className="text-xs text-warm-gray/40">{o.customerPhone}</div>}
                </td>
                <td className="px-4 py-3 text-warm-gray/80">
                  <div className="font-mono">{o.itemsCount}</div>
                  <div className="mt-0.5 text-xs text-warm-gray/45">{itemsSummary(o)}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-head text-warm-white">
                  {formatCop(o.amountCop)}
                </td>
                <td className="px-4 py-3">{statusSelect(o)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
