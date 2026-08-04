import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from './Icon'
import { useDict } from '../../i18n/useDict'
import { useMenuOpen } from '../../lib/menuOpen'
import { EASE_OUT_EXPO } from '../../lib/motion'

/**
 * Barra de compra fija (solo mobile) — aparece al pasar el hero, donde el CTA
 * del Nav no existe. Anima solo transform/opacity: cero layout shift.
 *
 * Se retira con el menú móvil abierto: el menú trae su propio "Comprar AXIS"
 * al pie y los dos son `fixed` abajo con el mismo z-index, así que se veían
 * solapados (el panel es semitransparente: bajarle el z-index no bastaba).
 */
export function BuyBar() {
  const { t } = useDict()
  const menuOpen = useMenuOpen()
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.85)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {show && !menuOpen && (
        <motion.div
          initial={{ y: '110%' }}
          animate={{ y: 0 }}
          exit={{ y: '110%' }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-carbon-900/90 px-4 pb-[calc(env(safe-area-inset-bottom)+0.7rem)] pt-3 backdrop-blur-xl md:hidden"
        >
          <Link href="/tienda" className="btn-axis w-full">
            {t.buyBar.cta}
            <Icon name="arrow" size={16} />
          </Link>
          <p className="mt-2 text-center font-mono text-[0.58rem] uppercase tracking-[0.16em] text-warm-gray/50">
            {t.buyBar.note}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
