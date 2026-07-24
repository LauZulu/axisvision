'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import { TreeLogo } from '../components/ui/TreeLogo'
import { Icon } from '../components/ui/Icon'
import { useDict } from '../i18n/useDict'
import { useScrollTo } from '../lib/scrollContext'
import { useTheme } from '../lib/useTheme'
import { useCart, cartCount } from '../lib/cart'
import { EASE_OUT_EXPO } from '../lib/motion'

/** Hamburguesa animada: las líneas exteriores se pliegan en X y la central se disuelve. */
function BurgerIcon({ open }: { open: boolean }) {
  const spring = { duration: 0.45, ease: EASE_OUT_EXPO }
  const line = 'absolute left-0 block h-[1.5px] w-full rounded-full bg-current'
  return (
    <span className="relative block h-[15px] w-[22px]">
      <motion.span
        className={`${line} top-0`}
        animate={open ? { rotate: 45, y: 6.75 } : { rotate: 0, y: 0 }}
        transition={spring}
      />
      <motion.span
        className={`${line} top-1/2 -translate-y-1/2`}
        animate={open ? { opacity: 0, x: 10 } : { opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
      />
      <motion.span
        className={`${line} bottom-0`}
        animate={open ? { rotate: -45, y: -6.75 } : { rotate: 0, y: 0 }}
        transition={spring}
      />
    </span>
  )
}

export function Nav() {
  const { t, lang, setLang } = useDict()
  const { theme, toggle } = useTheme()
  const scrollTo = useScrollTo()
  const pathname = usePathname()
  const router = useRouter()
  const reducedMotion = useReducedMotion()
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
    ['#product', t.nav.product],
    ['#capabilities', t.nav.capabilities],
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

  const panelV: Variants = {
    hidden: {
      opacity: 0,
      transition: { duration: 0.35, ease: EASE_OUT_EXPO, when: 'afterChildren' },
    },
    show: {
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: EASE_OUT_EXPO,
        when: 'beforeChildren',
        staggerChildren: reducedMotion ? 0 : 0.07,
        delayChildren: reducedMotion ? 0 : 0.05,
      },
    },
  }
  const rowV: Variants = reducedMotion
    ? {
        hidden: { opacity: 0, transition: { duration: 0.2 } },
        show: { opacity: 1, transition: { duration: 0.3 } },
      }
    : {
        hidden: { y: '115%', transition: { duration: 0.3, ease: EASE_OUT_EXPO } },
        show: { y: 0, transition: { duration: 0.65, ease: EASE_OUT_EXPO } },
      }
  const footV: Variants = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 14, transition: { duration: 0.25 } },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } },
  }

  const menuRows: Array<{ label: string; onClick?: () => void; href?: string }> = [
    ...links.map(([href, label]) => ({ label, onClick: () => go(href) })),
    { label: t.nav.store, href: '/tienda' },
  ]

  return (
    <>
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

        <div className="flex items-center gap-4 md:gap-5">
          <div className="hidden font-mono text-xs tracking-widest min-[400px]:block">
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
            {/* El icono gira/aparece al cambiar (key remonta el span) */}
            <motion.span
              key={theme}
              initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
              className="block"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
            </motion.span>
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

          <Link href="/tienda" className="btn-axis hidden md:inline-flex">
            {t.nav.cta}
          </Link>

          <button
            className="-mr-1 p-1 text-warm-white transition-colors hover:text-gold md:hidden"
            aria-label={menuOpen ? t.nav.menuClose : t.nav.menuOpen}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <BurgerIcon open={menuOpen} />
          </button>
        </div>
      </nav>

    </header>

    {/* Menú móvil a pantalla completa. Vive FUERA del <header>: su backdrop-blur lo
        convierte en containing block y colapsaría un descendiente position:fixed. */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            variants={panelV}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-carbon-900/95 pt-24 backdrop-blur-2xl md:hidden"
          >
            <TreeLogo
              aria-hidden
              className="pointer-events-none fixed -bottom-12 -right-10 h-80 w-auto text-gold opacity-[0.05]"
            />

            <nav className="container-axis flex flex-1 flex-col justify-center">
              {menuRows.map((row, i) => (
                <div key={row.label} className="overflow-hidden border-b border-line">
                  <motion.div variants={rowV}>
                    {row.href ? (
                      <Link
                        href={row.href}
                        onClick={() => setMenuOpen(false)}
                        className="flex w-full items-baseline gap-5 py-5"
                      >
                        <span className="font-mono text-xs tracking-[0.2em] text-gold/70">
                          0{i + 1}
                        </span>
                        <span className="font-head text-3xl font-light text-warm-white">
                          {row.label}
                        </span>
                      </Link>
                    ) : (
                      <button
                        onClick={row.onClick}
                        className="flex w-full items-baseline gap-5 py-5 text-left"
                      >
                        <span className="font-mono text-xs tracking-[0.2em] text-gold/70">
                          0{i + 1}
                        </span>
                        <span className="font-head text-3xl font-light text-warm-white">
                          {row.label}
                        </span>
                      </button>
                    )}
                  </motion.div>
                </div>
              ))}
            </nav>

            <motion.div
              variants={footV}
              className="container-axis pb-[max(2.5rem,env(safe-area-inset-bottom))]"
            >
              <Link
                href="/tienda"
                onClick={() => setMenuOpen(false)}
                className="btn-axis w-full"
              >
                {t.nav.cta}
              </Link>
              <div className="mt-6 flex items-center justify-between">
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-warm-gray/50">
                  {t.hero.eyebrow}
                </p>
                <div className="font-mono text-xs tracking-widest">
                  <button
                    onClick={() => setLang('es')}
                    className={lang === 'es' ? 'text-gold' : 'text-warm-gray/45'}
                  >
                    ES
                  </button>
                  <span className="mx-1 text-warm-gray/30">/</span>
                  <button
                    onClick={() => setLang('en')}
                    className={lang === 'en' ? 'text-gold' : 'text-warm-gray/45'}
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
