'use client'

import Link from 'next/link'
import { useDict } from '../../i18n/useDict'
import { formatCop } from '../../lib/products'
import { formatDateTime, fill } from '../../lib/format'
import { StockStepper } from './StockStepper'
import { StatusBadge } from './StatusBadge'
import type { AdminStats, LowStockProduct } from '../../server/admin'
import type { OrderStats } from '../../server/orders'
import type { OrderDTO } from '../../lib/orders'

function Tile({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string | number
  hint?: string
  accent?: 'gold' | 'warn'
}) {
  const valueColor =
    accent === 'gold' ? 'text-gold' : accent === 'warn' ? 'text-red-400' : 'text-warm-white'
  return (
    <div className="rounded-2xl border border-line bg-carbon-850 p-6">
      <div className="font-mono text-[0.7rem] uppercase tracking-widest text-warm-gray/55">{label}</div>
      <div className={`mt-2 font-head text-3xl ${valueColor}`}>{value}</div>
      {hint && <div className="mt-1 text-sm text-warm-gray/55">{hint}</div>}
    </div>
  )
}

export function DashboardView({
  stats,
  orderStats,
  lowStock,
  recent,
  threshold,
}: {
  stats: AdminStats
  orderStats: OrderStats
  lowStock: LowStockProduct[]
  recent: OrderDTO[]
  threshold: number
}) {
  const { t } = useDict()
  const d = t.admin.dashboard

  return (
    <div>
      <h1 className="font-head text-2xl text-warm-white">{d.title}</h1>
      <p className="mt-1 text-warm-gray/60">{d.subtitle}</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Tile label={d.revenue} value={formatCop(orderStats.revenueCop)} hint={d.revenueHint} accent="gold" />
        <Tile label={d.orders} value={orderStats.total} hint={fill(d.ordersHint, { n: orderStats.pending })} />
        <Tile label={d.inventoryValue} value={formatCop(stats.inventoryValueCop)} hint={d.inventoryValueHint} />
        <Tile label={d.units} value={stats.totalStock} hint={d.unitsHint} />
        <Tile
          label={d.products}
          value={stats.productsActive}
          hint={fill(d.productsHint, { active: stats.productsActive, total: stats.productsTotal })}
        />
        <Tile
          label={d.lowStock}
          value={stats.lowStock}
          hint={fill(d.lowStockHint, { n: threshold })}
          accent={stats.lowStock > 0 ? 'warn' : undefined}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-carbon-850 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-head text-lg text-warm-white">{d.restockTitle}</h2>
            <Link href="/admin/productos" className="font-mono text-xs tracking-widest text-gold hover:underline">
              {d.viewAll}
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="mt-4 text-sm text-warm-gray/55">{d.restockEmpty}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="truncate font-head text-warm-white">{p.name}</div>
                    <div className="font-mono text-xs text-warm-gray/45">{fill(d.restockRemaining, { n: p.stock })}</div>
                  </div>
                  <StockStepper productId={p.id} stock={p.stock} size="sm" />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-carbon-850 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-head text-lg text-warm-white">{d.recentTitle}</h2>
            <Link href="/admin/pedidos" className="font-mono text-xs tracking-widest text-gold hover:underline">
              {d.viewAll}
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-warm-gray/55">{d.recentEmpty}</p>
          ) : (
            <ul className="mt-4 divide-y divide-line/60">
              {recent.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm text-warm-white">{o.customerName}</div>
                    <div className="font-mono text-xs text-warm-gray/45">
                      {o.reference} · {formatDateTime(o.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <span className="text-sm text-warm-gray/80">{formatCop(o.amountCop)}</span>
                    <StatusBadge status={o.status} label={t.admin.orderStatus[o.status]} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
