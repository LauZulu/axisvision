import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
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
 * Carrusel con disolver suave color-a-color (sin pasar por negro): la imagen
 * nueva aparece ENCIMA de la anterior, que permanece opaca como base, así nunca
 * se ve el fondo oscuro durante la transición. Responsive (object-cover) y
 * accesible: con `prefers-reduced-motion` no auto-rota ni anima.
 */
export function ImageCarousel({ slides, interval = 4000, sizes = '50vw', className }: Props) {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [base, setBase] = useState(0) // imagen de fondo (la anterior ya asentada)

  useEffect(() => {
    if (reduce || slides.length <= 1) return
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length)
    }, interval)
    return () => clearInterval(id)
  }, [reduce, slides.length, interval])

  const current = slides[index]
  const baseSlide = slides[base]

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`} aria-roledescription="carrusel">
      {/* Capa base: imagen anterior, siempre opaca → evita el destello oscuro */}
      <div className="absolute inset-0">
        <Img picture={baseSlide.pic} alt="" sizes={sizes} className="h-full w-full object-cover object-center" />
      </div>

      {/* Capa superior: la imagen actual se funde sobre la base */}
      <motion.div
        key={index}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, ease: EASE_OUT_EXPO }}
        onAnimationComplete={() => setBase(index)}
        className="absolute inset-0"
      >
        <Img picture={current.pic} alt={current.alt} sizes={sizes} className="h-full w-full object-cover object-center" />
      </motion.div>

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
