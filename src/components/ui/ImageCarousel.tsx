import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Img } from './Img'
import { EASE_OUT_EXPO } from '../../lib/motion'

export type Slide = { pic: ResponsivePicture; alt: string }

/**
 * Una imagen que llena toda la caja: si va en `contain`, los márgenes se
 * rellenan con una versión borrosa de la MISMA foto (no de otra), para que
 * cada slide sea autónoma y no se superponga con la anterior en la transición.
 */
function Layer({
  slide,
  fit,
  sizes,
  withAlt,
}: {
  slide: Slide
  fit: 'cover' | 'contain'
  sizes: string
  withAlt: boolean
}) {
  const fg = `relative z-[1] h-full w-full object-center ${
    fit === 'contain' ? 'object-contain' : 'object-cover'
  }`
  return (
    <>
      {fit === 'contain' && (
        <Img
          picture={slide.pic}
          alt=""
          sizes="40vw"
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-2xl"
        />
      )}
      <Img picture={slide.pic} alt={withAlt ? slide.alt : ''} sizes={sizes} className={fg} />
    </>
  )
}

type Props = {
  slides: Slide[]
  /** Milisegundos entre cambios automáticos. */
  interval?: number
  /** Segundos que dura el fundido entre imágenes. */
  fade?: number
  /** `contain` muestra la imagen completa (sin recortar); `cover` la recorta para llenar. */
  fit?: 'cover' | 'contain'
  /** Hint de tamaño para el srcset responsive. */
  sizes?: string
  /** Clases del contenedor (define el aspect-ratio responsive). */
  className?: string
}

/**
 * Carrusel con disolver suave color-a-color (sin pasar por negro): la imagen
 * nueva aparece ENCIMA de la anterior, que permanece opaca como base. Cada
 * slide llena toda la caja (ver Layer), así no hay superposición entre fotos de
 * distinta proporción. Accesible: con `prefers-reduced-motion` no auto-rota.
 */
export function ImageCarousel({
  slides,
  interval = 5000,
  fade = 2.2,
  fit = 'cover',
  sizes = '50vw',
  className,
}: Props) {
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

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`} aria-roledescription="carrusel">
      {/* Capa base: imagen anterior, llena y opaca → sin destello ni superposición */}
      <div className="absolute inset-0">
        <Layer slide={slides[base]} fit={fit} sizes={sizes} withAlt={false} />
      </div>

      {/* Capa superior: la imagen actual se funde sobre la base */}
      <motion.div
        key={index}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: fade, ease: EASE_OUT_EXPO }}
        onAnimationComplete={() => setBase(index)}
        className="absolute inset-0"
      >
        <Layer slide={slides[index]} fit={fit} sizes={sizes} withAlt />
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
