import { getAdminStats } from '../../../src/server/admin'

export const dynamic = 'force-dynamic'

function StatTile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-carbon-850 p-6">
      <div className="font-mono text-[0.7rem] uppercase tracking-widest text-warm-gray/55">
        {label}
      </div>
      <div className="mt-2 font-head text-3xl text-warm-white">{value}</div>
      {hint && <div className="mt-1 text-sm text-warm-gray/55">{hint}</div>}
    </div>
  )
}

export default async function AdminDashboard() {
  let stats
  try {
    stats = await getAdminStats()
  } catch {
    return (
      <div className="rounded-2xl border border-line bg-carbon-850 p-8">
        <h1 className="font-head text-xl text-warm-white">Base de datos no disponible</h1>
        <p className="mt-2 text-warm-gray/70">
          No se pudo conectar a la base de datos. Verifica el túnel/credenciales y recarga.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-head text-2xl text-warm-white">Resumen del negocio</h1>
      <p className="mt-1 text-warm-gray/60">Vista general del inventario AXIS.</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Productos" value={stats.productsTotal} hint={`${stats.productsActive} activos`} />
        <StatTile label="Stock total" value={stats.totalStock} hint="unidades" />
        <StatTile label="Stock bajo" value={stats.lowStock} hint="≤ 3 unidades" />
        <StatTile label="Usuarios" value={stats.users} hint="cuentas creadas" />
        <StatTile label="Pedidos" value={stats.orders} hint="ventas registradas" />
      </div>
    </div>
  )
}
