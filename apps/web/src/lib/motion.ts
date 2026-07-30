import type { Variants } from 'framer-motion'

/** Easing "Apple lento" del sistema de lujo — refleja --ease-luxe de globals.css. */
export const EASE_LUXE = [0.25, 1, 0.5, 1] as const

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const

/** Duraciones > 800ms: el lujo se mueve despacio. */
export const DUR_LUXE = 0.9
export const DUR_LUXE_SLOW = 1.3

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DUR_LUXE, ease: EASE_LUXE },
  },
}

export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DUR_LUXE_SLOW, ease: EASE_LUXE } },
}

/** Imagen que asienta lentamente (escala 1.06 → 1) al revelarse. */
export const settleScale: Variants = {
  hidden: { opacity: 0, scale: 1.06 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: DUR_LUXE_SLOW + 0.3, ease: EASE_LUXE },
  },
}

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.08 } },
}

export const staggerFast: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

/** Config estándar de viewport para revelar una sola vez al entrar. */
export const inView = { once: true, amount: 0.25 } as const

/** Para piezas altas (figuras editoriales): revela apenas asoman. */
export const inViewSoon = { once: true, amount: 0.15 } as const
