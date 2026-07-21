import './_env'
import { getDb } from '../src/server/db'
import { AxisUser } from '../src/server/db/entities/User'

// Reproduce la conexión LARGA del server: una sola pool, varias consultas
// espaciadas. Si la 2ª+ falla, imprime el error real (lo que el 503 oculta).
const db = await getDb()
console.log('DataSource inicializado. host:', process.env.POSTGRES_HOST)
for (let i = 1; i <= 6; i++) {
  try {
    const n = await db.getRepository(AxisUser).count()
    console.log(`  consulta ${i}: OK (${n} usuarios)`)
  } catch (e) {
    console.log(`  consulta ${i}: ✗`, (e as Error).message)
  }
  await new Promise((r) => setTimeout(r, 4000))
}
process.exit(0)
