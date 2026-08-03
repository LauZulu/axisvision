import { getProductBySlug } from '../../../../src/server/products'
import { json, jsonError } from '../../../../src/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  try {
    const product = await getProductBySlug(slug)
    if (!product) return jsonError('NOT_FOUND', 'Producto no encontrado.', 404)
    return json({ product })
  } catch (err) {
    console.error(`[productos] no se pudo cargar el producto "${slug}":`, err)
    return jsonError('DB_UNAVAILABLE', 'No se pudo cargar el producto.', 503)
  }
}
