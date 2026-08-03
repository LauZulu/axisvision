import { getActiveProducts } from '../../../src/server/products'
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
    return jsonError('DB_UNAVAILABLE', 'No se pudo cargar el catálogo.', 503)
  }
}
