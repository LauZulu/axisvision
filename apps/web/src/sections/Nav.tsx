'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { TreeLogo } from '../components/ui/TreeLogo'
import { Icon } from '../components/ui/Icon'
import { useDict } from '../i18n/useDict'
import { useScrollTo } from '../lib/scrollContext'
import { useTheme } from '../lib/useTheme'
import { whatsappLink } from '../config/brand'
import { useCart, cartCount } from '../lib/cart'

export function Nav() {
  const { t, lang, setLang } = useDict()
  const { theme, toggle } = useTheme()
  const scrollTo = useScrollTo()
  const pathname = usePathname()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const itemCount = cartCount(useCart())

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links: Array<[string, string]> = [
    ['#product', t.nav.product],
    ['#capabilities', t.nav.capabilities],
    ['#editions', t.nav.editions],
    ['#contact', t.nav.contact],
  ]

  // Enlaces de ancla: en el home hacen scroll suave; en otra página navegan a /#ancla.
  const go = (sel: string) => {
    setMenuOpen(false)
    if (pathname !== '/') {
      router.push('/' + sel)
      return
    }
    scrollTo(sel)
  }

  const goTop = () => {
    setMenuOpen(false)
    if (pathname !== '/') {
      router.push('/')
      return
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled || menuOpen
          ? 'border-b border-line bg-carbon-900/85 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <nav className="container-axis flex h-16 items-center justify-between md:h-[72px]">
        <button
          onClick={goTop}
          className="flex items-center gap-2.5 text-gold"
          aria-label="AXIS — inicio"
        >
          <TreeLogo className="h-7 w-auto" />
          <span className="font-head text-sm tracking-[0.28em] text-warm-white">AXIS</span>
        </button>

        <div className="hidden items-center gap-9 md:flex">
          {links.map(([href, label]) => (
            <button
              key={href}
              onClick={() => go(href)}
              className="font-head text-sm text-warm-gray/85 transition-colors hover:text-gold"
            >
              {label}
            </button>
          ))}
          <Link
            href="/tienda"
            className="font-head text-sm text-warm-gray/85 transition-colors hover:text-gold"
          >
            {t.nav.store}
          </Link>
        </div>

        <div className="flex items-center gap-3 md:gap-5">
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

          <button
            onClick={toggle}
            aria-label={t.nav.theme}
            title={t.nav.theme}
            className="text-warm-gray/60 transition-colors hover:text-gold"
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} strokeWidth={1.5} />
          </button>

          <Link
            href="/tienda/carrito"
            aria-label={t.cart.title}
            className="relative text-warm-gray/60 transition-colors hover:text-gold"
          >
            <Icon name="bag" size={19} strokeWidth={1.5} />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 font-mono text-[0.6rem] leading-none text-carbon-900">
                {itemCount}
              </span>
            )}
          </Link>

          <a
            href={whatsappLink('general')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-axis hidden md:inline-flex"
          >
            {t.nav.cta}
          </a>

          <button
            className="text-warm-white md:hidden"
            aria-label="Menú"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <Icon name={menuOpen ? 'check' : 'arrow'} size={22} />
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="container-axis flex flex-col gap-1 pb-5 md:hidden">
          {links.map(([href, label]) => (
            <button
              key={href}
              onClick={() => go(href)}
              className="border-b border-line py-3 text-left font-head text-warm-gray"
            >
              {label}
            </button>
          ))}
          <Link
            href="/tienda"
            onClick={() => setMenuOpen(false)}
            className="border-b border-line py-3 text-left font-head text-warm-gray"
          >
            {t.nav.store}
          </Link>
          <a
            href={whatsappLink('general')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-axis mt-3 w-full"
          >
            {t.nav.cta}
          </a>
        </div>
      )}
    </header>
  )
}
