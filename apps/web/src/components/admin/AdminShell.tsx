'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { TreeLogo } from '../ui/TreeLogo'
import { Icon } from '../ui/Icon'
import { useDict } from '../../i18n/useDict'

export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  const { t, lang, setLang } = useDict()
  const pathname = usePathname()
  const router = useRouter()

  const nav = [
    { href: '/admin', label: t.admin.nav.dashboard },
    { href: '/admin/productos', label: t.admin.nav.products },
    { href: '/admin/pedidos', label: t.admin.nav.orders },
  ]

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/admin/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-carbon-900/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2 text-gold">
              <TreeLogo className="h-6 w-auto" />
              <span className="font-mono text-[0.7rem] tracking-[0.22em] text-warm-gray/70">ADMIN</span>
            </Link>
            <nav className="flex items-center gap-1">
              {nav.map((item) => {
                const active =
                  item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                      active ? 'bg-carbon-800 text-warm-white' : 'text-warm-gray/70 hover:text-gold'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="font-mono text-xs tracking-widest">
              <button
                onClick={() => setLang('es')}
                className={lang === 'es' ? 'text-gold' : 'text-warm-gray/45 hover:text-warm-gray'}
              >
                ES
              </button>
              <span className="mx-1 text-warm-gray/30">/</span>
              <button
                onClick={() => setLang('en')}
                className={lang === 'en' ? 'text-gold' : 'text-warm-gray/45 hover:text-warm-gray'}
              >
                EN
              </button>
            </div>
            <Link
              href="/"
              className="hidden text-sm text-warm-gray/60 transition-colors hover:text-gold sm:inline"
            >
              {t.admin.nav.viewSite}
            </Link>
            <span className="hidden font-mono text-xs text-warm-gray/50 md:inline">{email}</span>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm text-warm-gray/80 transition-colors hover:border-gold/50 hover:text-gold"
            >
              {t.admin.nav.logout}
              <Icon name="arrow" size={14} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
    </div>
  )
}
