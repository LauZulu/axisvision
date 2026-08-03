import { getAllLensOptions, createLensOption } from '../../../../src/server/lenses'
import { lensOptionSchema } from '../../../../src/server/validation'
import { requireAdmin } from '../../../../src/server/guard'
import { json, jsonError } from '../../../../src/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const gate = await requireAdmin()
  if (gate.response) return gate.response
  try {
    return json({ options: await getAllLensOptions() })
  } catch (err) {
    console.error('[admin/lentes] no se pudieron cargar las opciones:', err)
    return jsonError('DB_UNAVAILABLE', 'No se pudieron cargar las opciones de lente.', 503)
  }
}

export async function POST(req: Request) {
  const gate = await requireAdmin()
  if (gate.response) return gate.response

  const parsed = lensOptionSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return jsonError('INVALID_BODY', 'Datos de la opción de lente inválidos.', 400)
  }
  try {
    return json({ id: await createLensOption(parsed.data) }, 201)
  } catch (err) {
    console.error('[admin/lentes] no se pudo crear la opción:', err)
    return jsonError('DB_ERROR', 'No se pudo crear la opción.', 500)
  }
}
