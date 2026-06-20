import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Img } from './Img'
import { EASE_OUT_EXPO } from '../../lib/motion'

export type Slide = { pic: ResponsivePicture; alt: string }

type Props = {
  slides: Slide[]
  /** Milisegundos entre cambios automáticos. */
  interval?: number
  /** Hint de tamaño para el srcset responsive. */
  sizes?: string
  /** Clases del contenedor (define el aspect-ratio responsive). */
  className?: string
}

/**
 * Carrusel de imágenes con crossfade automático. Responsive (las slides van
 * en object-cover sobre el contenedor) y accesible: con `prefers-reduced-motion`
 * no auto-rota y muestra una sola imagen estática.
 */
export function ImageCarousel({ slides, interval = 3000, sizes = '50vw', className }: Props) {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (reduce || slides.length <= 1) return
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length)
    }, interval)
    return () => clearInterval(id)
  }, [reduce, slides.length, interval])

  const current = slides[index]

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`} aria-roledescription="carrusel">
      <AnimatePresence>
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: EASE_OUT_EXPO }}
          className="absolute inset-0"
        >
          <Img picture={current.pic} alt={current.alt} sizes={sizes} className="h-full w-full object-cover object-center" />
        </motion.div>
      </AnimatePresence>

      {slides.length > 1 && (
        <div className="absolute bottom-3.5 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ver imagen ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === index ? 'w-5 bg-gold' : 'w-1.5 bg-warm-white/40 hover:bg-warm-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
