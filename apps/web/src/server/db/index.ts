import type { DataSource } from 'typeorm'
import { buildDataSource } from './data-source'

// Singleton de conexión para Next: una sola pool que sobrevive al HMR de dev y
// se reutiliza entre requests (evita abrir una conexión por invocación).
const globalForDb = globalThis as unknown as { __axisDataSource?: DataSource }

/** Devuelve el DataSource ya inicializado (lo inicializa la primera vez). */
export async function getDb(): Promise<DataSource> {
  if (!globalForDb.__axisDataSource) {
    console.log('[db] creando nuevo DataSource')
    globalForDb.__axisDataSource = buildDataSource()
  }
  const ds = globalForDb.__axisDataSource
  if (!ds.isInitialized) {
    try {
      console.log('[db] inicializando…')
      await ds.initialize()
      console.log('[db] inicializado OK')
    } catch (err) {
      console.error('[db] init FALLÓ:', (err as Error).message)
      // No dejar cacheada una conexión a medio inicializar: el próximo request reintenta limpio.
      globalForDb.__axisDataSource = undefined
      throw err
    }
  }
  return ds
}

export { ENTITIES } from './data-source'
export { AxisUser } from './entities/User'
export { AxisProduct } from './entities/Product'
export { AxisProductImage } from './entities/ProductImage'
export { AxisOrder } from './entities/Order'
export { AxisOrderItem } from './entities/OrderItem'
export { AxisFavorite } from './entities/Favorite'
