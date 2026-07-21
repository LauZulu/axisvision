import { handleLogin } from '../../../../../src/server/auth/login'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function POST(req: Request) {
  return handleLogin(req, 'admin')
}
