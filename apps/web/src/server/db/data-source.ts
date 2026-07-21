import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { AxisUser } from './entities/User'
import { AxisProduct } from './entities/Product'
import { AxisProductImage } from './entities/ProductImage'
import { AxisOrder } from './entities/Order'
import { AxisOrderItem } from './entities/OrderItem'
import { AxisFavorite } from './entities/Favorite'
import { InitAxisSchema1720000000000 } from './migrations/1720000000000-InitAxisSchema'

export const ENTITIES = [
  AxisUser,
  AxisProduct,
  AxisProductImage,
  AxisOrder,
  AxisOrderItem,
  AxisFavorite,
]

/**
 * Config de conexión a Postgres (RDS). Reglas de seguridad del repo:
 *  - `synchronize: FALSE` SIEMPRE (nunca auto-sync contra la RDS compartida).
 *  - SSL con `rejectUnauthorized:false` (RDS exige SSL con cert no estricto),
 *    salvo `POSTGRES_SSL=false` (Postgres local / túnel sin SSL).
 *  - Bookkeeping de migraciones en `axis_migrations` (no colisiona con otras).
 *
 * En local, la RDS suele llegar por un túnel: fijar POSTGRES_HOST=localhost y
 * POSTGRES_PORT=5433 vía `.env.local` (tiene prioridad sobre `.env`).
 */
export function buildDataSource(): DataSource {
  return new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT) || 5432,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    ssl: process.env.POSTGRES_SSL === 'false' ? undefined : { rejectUnauthorized: false },
    synchronize: false,
    logging: process.env.TYPEORM_LOGGING === 'true',
    entities: ENTITIES,
    migrations: [InitAxisSchema1720000000000],
    migrationsTableName: 'axis_migrations',
    // Resiliencia del pool: keepAlive evita que conexiones ociosas mueran en
    // silencio (NAT/firewall); timeouts razonables para no colgar requests.
    extra: {
      max: 10,
      keepAlive: true,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
    },
  })
}

// NOTA: no se instancia el DataSource a nivel de módulo a propósito. Hacerlo
// dispara la lectura de metadata de entidades en tiempo de import y, en el grafo
// de Next, provoca TDZ ("Cannot access before initialization"). Se crea siempre
// de forma perezosa: getDb() en Next (singleton) y buildDataSource() en scripts.
