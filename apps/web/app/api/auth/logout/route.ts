import { json, clearAuthCookie } from '../../../../src/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function POST() {
  return clearAuthCookie(json({ ok: true }))
}
