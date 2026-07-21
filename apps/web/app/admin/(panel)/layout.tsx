import { redirect } from 'next/navigation'
import { getAdminSession } from '../../../src/server/auth/session'
import { AdminShell } from '../../../src/components/admin/AdminShell'

// Guard del panel (defensa en profundidad además del middleware). El grupo
// (panel) NO afecta la URL: /admin, /admin/productos, etc. quedan protegidos;
// /admin/login vive fuera de este grupo y no pasa por aquí.
export const dynamic = 'force-dynamic'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  return <AdminShell email={session.email}>{children}</AdminShell>
}
