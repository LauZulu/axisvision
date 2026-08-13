import './_env'
import { buildDataSource } from '../src/server/db/data-source'
// Se comprueba con la MISMA consulta que usa el panel, no leyendo la tabla a mano.
process.env.__ = '1'
const { listStockAlerts } = await import('../src/server/waitlist')
const ds = await buildDataSource().initialize()
await ds.destroy()
const rows = await listStockAlerts()
for (const r of rows) {
  console.log(
    `${(r.name ?? '—').padEnd(16)} ${r.productName.padEnd(14)} lente=${r.lensName ?? '—'} · AR=${r.withCoating} · fórmula=${r.withPrescription}`,
  )
}
