import Link from 'next/link'
import { getAdminStats, getLowStockProducts, LOW_STOCK_THRESHOLD } from '../../../src/server/admin'
import { getOrderStats, getRecentOrders } from '../../../src/server/orders'
import { formatCop } from '../../../src/lib/products'
import { orderStatusLabel } from '../../../src/lib/orders'
import { StockStepper } from '../../../src/components/admin/StockStepper'
import { StatusBadge } from '../../../src/components/admin/StatusBadge'
import { formatDateTime } from '../../../src/lib/format'

export const dynamic = 'force-dynamic'

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
  const valueColor = accent === 'gold' ? 'text-gold' : accent === 'warn' ? 'text-red-400' : 'text-warm-white'
  return (
    <div className="rounded-2xl border border-line bg-carbon-850 p-6">
      <div className="font-mono text-[0.7rem] uppercase tracking-widest text-warm-gray/55">{label}</div>
      <div className={`mt-2 font-head text-3xl ${valueColor}`}>{value}</div>
      {hint && <div className="mt-1 text-sm text-warm-gray/55">{hint}</div>}
    </div>
  )
}

export default async function AdminDashboard() {
  let data
  try {
    const [stats, orderStats, lowStock, recent] = await Promise.all([
      getAdminStats(),
      getOrderStats(),
      getLowStockProducts(),
      getRecentOrders(6),
    ])
    data = { stats, orderStats, lowStock, recent }
  } catch {
    return (
      <div className="rounded-2xl border border-line bg-carbon-850 p-8">
        <h1 className="font-head text-xl text-warm-white">Base de datos no disponible</h1>
        <p className="mt-2 text-warm-gray/70">No se pudo conectar. Verifica la conexión y recarga.</p>
      </div>
    )
  }

  const { stats, orderStats, lowStock, recent } = data

  return (
    <div>
      <h1 className="font-head text-2xl text-warm-white">Resumen del negocio</h1>
      <p className="mt-1 text-warm-gray/60">Inventario, ventas y alertas de AXIS en un vistazo.</p>

      {/* KPIs */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Tile label="Ingresos" value={formatCop(orderStats.revenueCop)} hint="pedidos pagados+" accent="gold" />
        <Tile label="Pedidos" value={orderStats.total} hint={`${orderStats.pending} pendientes`} />
        <Tile label="Valor de inventario" value={formatCop(stats.inventoryValueCop)} hint="stock × precio" />
        <Tile label="Unidades en stock" value={stats.totalStock} hint="suma de existencias" />
        <Tile
          label="Productos"
          value={stats.productsActive}
          hint={`${stats.productsActive} activos · ${stats.productsTotal} en total`}
        />
        <Tile
          label="Stock bajo"
          value={stats.lowStock}
          hint={`≤ ${LOW_STOCK_THRESHOLD} unidades`}
          accent={stats.lowStock > 0 ? 'warn' : undefined}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Stock bajo — accionable */}
        <section className="rounded-2xl border border-line bg-carbon-850 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-head text-lg text-warm-white">Reponer stock</h2>
            <Link href="/admin/productos" className="font-mono text-xs tracking-widest text-gold hover:underline">
              Ver todo
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="mt-4 text-sm text-warm-gray/55">Todo con buen stock. 👌</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="truncate font-head text-warm-white">{p.name}</div>
                    <div className="font-mono text-xs text-warm-gray/45">quedan {p.stock}</div>
                  </div>
                  <StockStepper productId={p.id} stock={p.stock} size="sm" />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Pedidos recientes */}
        <section className="rounded-2xl border border-line bg-carbon-850 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-head text-lg text-warm-white">Pedidos recientes</h2>
            <Link href="/admin/pedidos" className="font-mono text-xs tracking-widest text-gold hover:underline">
              Ver todo
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-warm-gray/55">Aún no hay pedidos.</p>
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
                    <StatusBadge status={o.status} label={orderStatusLabel[o.status]} />
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
