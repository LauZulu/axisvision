import { getActiveProducts } from '../../../src/server/products'
import { json, jsonError } from '../../../src/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return json({ products: await getActiveProducts() })
  } catch {
    return jsonError('DB_UNAVAILABLE', 'No se pudo cargar el catálogo.', 503)
  }
}
