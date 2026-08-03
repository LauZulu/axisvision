import { getActiveProducts } from '../../../src/server/products'
import { DbConfigError } from '../../../src/server/db/data-source'
import { json, jsonError } from '../../../src/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return json({ products: await getActiveProducts() })
  } catch (err) {
    // Sin este log, una DB caída (o mal configurada en el hosting) sale como un
    // 503 mudo: en los logs del servidor no queda NADA que diga por qué.
    console.error('[productos] no se pudo cargar el catálogo:', err)
    // El código distingue las dos causas SIN exponer detalles: DB_CONFIG = al
    // despliegue le faltan variables; DB_UNAVAILABLE = hay config pero no se
    // pudo conectar (red, security group, credenciales). Se arreglan en sitios
    // distintos, y con un solo código había que entrar a los logs para saberlo.
    const code = err instanceof DbConfigError ? 'DB_CONFIG' : 'DB_UNAVAILABLE'
    return jsonError(code, 'No se pudo cargar el catálogo.', 503)
  }
}
