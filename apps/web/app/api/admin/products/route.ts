import { getAllProducts } from '../../../../src/server/products'
import { createProduct } from '../../../../src/server/admin'
import { productSchema } from '../../../../src/server/validation'
import { requireAdmin } from '../../../../src/server/guard'
import { json, jsonError } from '../../../../src/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const gate = await requireAdmin()
  if (gate.response) return gate.response
  try {
    return json({ products: await getAllProducts() })
  } catch {
    return jsonError('DB_UNAVAILABLE', 'No se pudo cargar el catálogo.', 503)
  }
}

export async function POST(req: Request) {
  const gate = await requireAdmin()
  if (gate.response) return gate.response

  const parsed = productSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return jsonError('INVALID_BODY', 'Datos de producto inválidos.', 400)
  }
  try {
    const id = await createProduct(parsed.data)
    return json({ id }, 201)
  } catch {
    return jsonError('DB_ERROR', 'No se pudo crear el producto.', 500)
  }
}
