'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCop } from '../../lib/products'
import { formatDateTime } from '../../lib/format'
import { ORDER_STATUSES, orderStatusLabel, type OrderDTO, type OrderStatus } from '../../lib/orders'

export function OrderTable({ orders }: { orders: OrderDTO[] }) {
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
      <div className="rounded-2xl border border-line bg-carbon-850 p-8 text-warm-gray/60">
        Aún no hay pedidos. Aparecerán aquí cuando alguien complete el checkout.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-line bg-carbon-850 text-warm-gray/55">
          <tr>
            <th className="px-4 py-3 font-mono text-xs uppercase tracking-widest">Pedido</th>
            <th className="px-4 py-3 font-mono text-xs uppercase tracking-widest">Cliente</th>
            <th className="px-4 py-3 font-mono text-xs uppercase tracking-widest">Ítems</th>
            <th className="px-4 py-3 font-mono text-xs uppercase tracking-widest">Total</th>
            <th className="px-4 py-3 font-mono text-xs uppercase tracking-widest">Estado</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-line/60 last:border-0 align-top">
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="font-mono text-warm-white">{o.reference}</div>
                <div className="font-mono text-xs text-warm-gray/45">{formatDateTime(o.createdAt)}</div>
              </td>
              <td className="px-4 py-3">
                <div className="text-warm-white">{o.customerName}</div>
                <div className="text-xs text-warm-gray/50">{o.customerEmail}</div>
                {o.customerPhone && <div className="text-xs text-warm-gray/40">{o.customerPhone}</div>}
              </td>
              <td className="px-4 py-3 text-warm-gray/80">
                <div className="font-mono">{o.itemsCount}</div>
                <div className="mt-0.5 text-xs text-warm-gray/45">
                  {o.items.map((it) => `${it.quantity}× ${it.productName}`).join(', ')}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap font-head text-warm-white">
                {formatCop(o.amountCop)}
              </td>
              <td className="px-4 py-3">
                <select
                  value={o.status}
                  disabled={busy === o.id}
                  onChange={(e) => changeStatus(o, e.target.value as OrderStatus)}
                  className="rounded-md border border-line bg-carbon-900 px-2 py-1.5 text-sm text-warm-white outline-none focus:border-gold/60 disabled:opacity-50"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {orderStatusLabel[s]}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
