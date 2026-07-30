'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import { TreeLogo } from '../components/ui/TreeLogo'
import { useDict } from '../i18n/useDict'
import { useScrollTo } from '../lib/scrollContext'
import { useCart, cartCount } from '../lib/cart'
import { EASE_LUXE } from '../lib/motion'

/**
 * Navegación mínima de lujo: marca, tres anclas, idioma, bolsa (texto, sin
 * iconos) y un único CTA. Compartida con /tienda — mantiene las alturas
 * h-16 / md:h-[72px] que asume app/tienda/layout.tsx.
 */
export function Nav() {
  const { t, lang, setLang } = useDict()
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

  // Con el menú abierto: bloquear el scroll de fondo, cerrar con Escape
  // y cerrar solo si el viewport pasa a desktop (≥768px).
  useEffect(() => {
    if (!menuOpen) return
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    const mq = window.matchMedia('(min-width: 768px)')
    const onMq = () => mq.matches && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    mq.addEventListener('change', onMq)
    return () => {
      document.documentElement.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      mq.removeEventListener('change', onMq)
    }
  }, [menuOpen])

  useEffect(() => setMenuOpen(false), [pathname])

  const links: Array<[string, string]> = [
    ['#collection', t.nav.collection],
    ['#craftsmanship', t.nav.craftsmanship],
    ['#founder', t.nav.founder],
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

  const panelV: Variants = {
    hidden: { opacity: 0, transition: { duration: 0.5, ease: EASE_LUXE, when: 'afterChildren' } },
    show: {
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: EASE_LUXE,
        when: 'beforeChildren',
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  }
  const rowV: Variants = {
    hidden: { y: '115%', transition: { duration: 0.4, ease: EASE_LUXE } },
    show: { y: 0, transition: { duration: 0.9, ease: EASE_LUXE } },
  }
  const footV: Variants = {
    hidden: { opacity: 0, transition: { duration: 0.3 } },
    show: { opacity: 1, transition: { duration: 0.9, ease: EASE_LUXE } },
  }

  const bagLabel = `${t.nav.bag}${itemCount > 0 ? ` (${itemCount})` : ''}`

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-700 ${
          scrolled || menuOpen ? 'bg-canvas/95' : 'bg-transparent'
        }`}
      >
        <nav className="container-axis flex h-16 items-center justify-between md:h-[72px]">
          <button
            onClick={goTop}
            className="flex items-center gap-2.5 text-ink"
            aria-label={t.nav.home}
          >
            <TreeLogo className="h-6 w-auto" strokeWidth={5} />
            <span className="font-head text-sm tracking-[0.32em]">AXIS</span>
          </button>

          <div className="hidden items-center gap-10 md:flex">
            {links.map(([href, label]) => (
              <button
                key={href}
                onClick={() => go(href)}
                className="font-head text-[0.8rem] tracking-[0.08em] text-warm-gray/80 transition-colors duration-700 hover:text-bronze-deep"
              >
                {label}
              </button>
            ))}
            <Link
              href="/tienda"
              className="font-head text-[0.8rem] tracking-[0.08em] text-warm-gray/80 transition-colors duration-700 hover:text-bronze-deep"
            >
              {t.nav.store}
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden font-mono text-[0.68rem] tracking-[0.18em] min-[400px]:block">
              <button
                onClick={() => setLang('es')}
                aria-pressed={lang === 'es'}
                className={
                  lang === 'es'
                    ? 'text-bronze-deep underline underline-offset-4'
                    : 'text-warm-gray/75 transition-colors duration-700 hover:text-ink'
                }
              >
                ES
              </button>
              <span className="mx-1 text-warm-gray/40">/</span>
              <button
                onClick={() => setLang('en')}
                aria-pressed={lang === 'en'}
                className={
                  lang === 'en'
                    ? 'text-bronze-deep underline underline-offset-4'
                    : 'text-warm-gray/75 transition-colors duration-700 hover:text-ink'
                }
              >
                EN
              </button>
            </div>

            <Link
              href="/tienda/carrito"
              className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-warm-gray/80 transition-colors duration-700 hover:text-bronze-deep"
            >
              {bagLabel}
            </Link>

            <Link href="/tienda" className="btn-ink btn-sm hidden md:inline-flex">
              {t.nav.cta}
            </Link>

            <button
              className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink md:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? t.nav.menuClose : t.nav.menuOpen}
            </button>
          </div>
        </nav>
      </header>

      {/* Menú móvil a pantalla completa — lienzo sólido, tipografía grande. */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label={t.nav.menuOpen}
            data-lenis-prevent
            variants={panelV}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="bg-canvas fixed inset-0 z-40 flex flex-col overflow-y-auto pt-24 md:hidden"
          >
            <nav className="container-axis flex flex-1 flex-col justify-center gap-2">
              {[...links, ['/tienda', t.nav.store] as [string, string]].map(([href, label], i) => (
                <div key={label} className="overflow-hidden">
                  <motion.div variants={rowV}>
                    {href.startsWith('#') ? (
                      <button onClick={() => go(href)} className="flex w-full items-baseline gap-5 py-4 text-left">
                        <span className="font-mono text-[0.62rem] tracking-[0.2em] text-warm-gray/75">
                          0{i + 1}
                        </span>
                        <span className="font-display text-4xl text-ink">{label}</span>
                      </button>
                    ) : (
                      <Link
                        href={href}
                        onClick={() => setMenuOpen(false)}
                        className="flex w-full items-baseline gap-5 py-4"
                      >
                        <span className="font-mono text-[0.62rem] tracking-[0.2em] text-warm-gray/75">
                          0{i + 1}
                        </span>
                        <span className="font-display text-4xl text-ink">{label}</span>
                      </Link>
                    )}
                  </motion.div>
                </div>
              ))}
            </nav>

            <motion.div
              variants={footV}
              className="container-axis pb-[max(2.5rem,env(safe-area-inset-bottom))]"
            >
              <Link href="/tienda" onClick={() => setMenuOpen(false)} className="btn-ink w-full">
                {t.nav.cta}
              </Link>
              <div className="mt-8 flex items-center justify-between">
                <Link
                  href="/tienda/carrito"
                  onClick={() => setMenuOpen(false)}
                  className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-warm-gray/70"
                >
                  {bagLabel}
                </Link>
                <div className="font-mono text-[0.68rem] tracking-[0.18em]">
                  <button
                    onClick={() => setLang('es')}
                    aria-pressed={lang === 'es'}
                    className={
                      lang === 'es'
                        ? 'text-bronze-deep underline underline-offset-4'
                        : 'text-warm-gray/75'
                    }
                  >
                    ES
                  </button>
                  <span className="mx-1 text-warm-gray/40">/</span>
                  <button
                    onClick={() => setLang('en')}
                    aria-pressed={lang === 'en'}
                    className={
                      lang === 'en'
                        ? 'text-bronze-deep underline underline-offset-4'
                        : 'text-warm-gray/75'
                    }
                  >
                    EN
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
