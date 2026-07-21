import './_env'
import { buildDataSource } from '../src/server/db/data-source'

// Corre las migraciones pendientes contra la RDS. synchronize está OFF: este es
// el ÚNICO camino para cambiar el esquema. Crea solo tablas axis_* y su
// bookkeeping en axis_migrations.
async function main() {
  const AppDataSource = buildDataSource()
  await AppDataSource.initialize()
  const pending = await AppDataSource.showMigrations()
  console.log(`Migraciones pendientes: ${pending ? 'sí' : 'no'}`)
  const ran = await AppDataSource.runMigrations({ transaction: 'all' })
  if (ran.length === 0) {
    console.log('Nada que aplicar (esquema al día).')
  } else {
    console.log(`✓ Aplicadas: ${ran.map((m) => m.name).join(', ')}`)
  }
  await AppDataSource.destroy()
}

main().catch((err) => {
  console.error('✗ Migración falló:', err instanceof Error ? err.message : err)
  process.exit(1)
})
