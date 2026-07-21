import { getSession } from '../../../../src/server/auth/session'
import { findById, toPublicUser } from '../../../../src/server/auth/users'
import { json } from '../../../../src/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return json({ user: null })
  const user = await findById(session.userId)
  return json({ user: user ? toPublicUser(user) : null })
}
