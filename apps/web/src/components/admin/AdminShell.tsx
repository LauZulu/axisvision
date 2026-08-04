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
    { href: '/admin/inventario', label: t.admin.nav.inventory },
    { href: '/admin/lentes', label: t.admin.nav.lenses },
    { href: '/admin/pedidos', label: t.admin.nav.orders },
    { href: '/admin/reservas', label: t.admin.nav.waitlist },
  ]

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/admin/login')
    router.refresh()
  }

  // Las pestañas se pintan dos veces —en línea con el logo en escritorio, en su
  // propia tira deslizable en móvil— porque en una sola fila de 430px los seis
  // enlaces + logo + sesión quedaban ilegibles (y encogidos, no recortados).
  const links = nav.map((item) => {
    const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? 'page' : undefined}
        className={`shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors md:py-1.5 ${
          active ? 'bg-carbon-800 text-warm-white' : 'text-warm-gray/70 hover:text-gold'
        }`}
      >
        {item.label}
      </Link>
    )
  })

  return (
    <div className="min-h-[100svh]">
      <header className="sticky top-0 z-40 border-b border-line bg-carbon-900/85 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 sm:px-5">
          <div className="flex h-14 items-center justify-between gap-3 md:h-16">
            <div className="flex min-w-0 items-center gap-6">
              <Link href="/admin" className="flex items-center gap-2 text-gold">
                <TreeLogo className="h-6 w-auto" />
                <span className="font-mono text-[0.7rem] tracking-[0.22em] text-warm-gray/70">
                  ADMIN
                </span>
              </Link>
              <nav className="hidden items-center gap-1 md:flex">{links}</nav>
            </div>

            <div className="flex shrink-0 items-center gap-3 sm:gap-4">
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
              {/* La salida al sitio estaba oculta bajo `sm`: en el teléfono el
                  panel era un callejón sin salida. En móvil queda como flecha. */}
              <Link
                href="/"
                aria-label={t.admin.nav.viewSite}
                className="inline-flex items-center text-sm text-warm-gray/60 transition-colors hover:text-gold"
              >
                <Icon name="arrow" size={16} className="rotate-180 sm:hidden" />
                <span className="hidden sm:inline">{t.admin.nav.viewSite}</span>
              </Link>
              <span className="hidden font-mono text-xs text-warm-gray/50 lg:inline">{email}</span>
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm text-warm-gray/80 transition-colors hover:border-gold/50 hover:text-gold"
              >
                {t.admin.nav.logout}
                <Icon name="arrow" size={14} />
              </button>
            </div>
          </div>

          {/* Móvil: las pestañas en su propia fila, deslizable de lado. */}
          <nav className="no-scrollbar -mx-4 flex items-center gap-1 overflow-x-auto px-4 pb-2 md:hidden">
            {links}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-7 sm:px-5 sm:py-10">{children}</main>
    </div>
  )
}
