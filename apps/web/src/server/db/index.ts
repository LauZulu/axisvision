import type { DataSource } from 'typeorm'
import { buildDataSource } from './data-source'
import { AxisUser } from './entities/User'

// Singleton de conexión para Next: una sola pool reutilizada entre requests.
const globalForDb = globalThis as unknown as { __axisDataSource?: DataSource }

/**
 * Devuelve el DataSource inicializado.
 *
 * Cuidado con el HMR de Next dev: cada Fast Refresh recrea las CLASES de entidad,
 * pero el DataSource cacheado quedó con las clases viejas y TypeORM falla con
 * "No metadata for AxisUser". Detectamos ese desajuste (hasMetadata con la clase
 * ACTUAL) y reconstruimos. En producción (sin HMR) esto nunca se dispara.
 */
export async function getDb(): Promise<DataSource> {
  let ds = globalForDb.__axisDataSource

  // ¿DataSource desincronizado por HMR? Reconstruir con las clases actuales.
  if (ds?.isInitialized && !ds.hasMetadata(AxisUser)) {
    try {
      await ds.destroy()
    } catch {
      /* ignora errores al cerrar la conexión vieja */
    }
    ds = undefined
    globalForDb.__axisDataSource = undefined
  }

  if (!ds) {
    ds = buildDataSource()
    globalForDb.__axisDataSource = ds
  }

  if (!ds.isInitialized) {
    try {
      await ds.initialize()
    } catch (err) {
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
