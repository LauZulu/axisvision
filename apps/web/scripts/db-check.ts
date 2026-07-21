import './_env'
import { Client } from 'pg'

// Verificación de conexión a la RDS. NO imprime credenciales: solo confirma el
// enlace y lista las tablas existentes (para no colisionar con el prefijo axis_).
async function main() {
  const host = process.env.POSTGRES_HOST
  const database = process.env.POSTGRES_DB
  if (!host || !database) {
    console.error('Faltan variables POSTGRES_* en el entorno (.env).')
    process.exit(1)
  }

  const client = new Client({
    host,
    port: Number(process.env.POSTGRES_PORT) || 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database,
    ssl: process.env.POSTGRES_SSL === 'false' ? undefined : { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  })

  await client.connect()
  console.log(`✓ Conectado a la base "${database}" en ${host.replace(/\..*/, '.***')}`)

  const res = await client.query<{ table_name: string }>(
    "select table_name from information_schema.tables where table_schema = 'public' order by table_name",
  )
  const all = res.rows.map((r) => r.table_name)
  const axis = all.filter((t) => t.startsWith('axis_'))
  console.log(`Tablas en public: ${all.length}`)
  console.log(`  · tablas axis_*: ${axis.length ? axis.join(', ') : '(ninguna todavía)'}`)
  console.log(`  · colisión de nombres axis_*: ${axis.length ? 'SÍ (revisar)' : 'no'}`)

  await client.end()
}

main().catch((err) => {
  console.error('✗ Fallo de conexión:', err instanceof Error ? err.message : err)
  process.exit(1)
})
