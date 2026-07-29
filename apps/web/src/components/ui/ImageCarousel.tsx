import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Image, { type StaticImageData } from 'next/image'

// `src` admite imagen local (StaticImageData) o URL remota de CloudFront (string).
export type Slide = { src: StaticImageData | string; alt: string }

/**
 * Una imagen que llena toda la caja (next/image `fill`): si va en `contain`, los
 * márgenes se rellenan con una versión borrosa de la MISMA foto, para que cada
 * slide sea autónoma y no se superponga con la anterior.
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
  return (
    <>
      {fit === 'contain' && (
        // Relleno de márgenes: misma foto, borrosa y oscurecida con `brightness`
        // (NO con opacity), para que se desvanezca a la par de la imagen.
        <Image
          src={slide.src}
          alt=""
          fill
          sizes={sizes}
          className="scale-110 object-cover blur-2xl brightness-[0.5]"
        />
      )}
      <Image
        src={slide.src}
        alt={withAlt ? slide.alt : ''}
        fill
        sizes={sizes}
        className={`z-[1] object-center ${fit === 'contain' ? 'object-contain' : 'object-cover'}`}
      />
    </>
  )
}

type Props = {
  slides: Slide[]
  /** Milisegundos entre cambios automáticos. */
  interval?: number
  /** Segundos que dura el desvanecido entre imágenes. */
  fade?: number
  /** `contain` muestra la imagen completa (sin recortar); `cover` la recorta para llenar. */
  fit?: 'cover' | 'contain'
  /** Hint de tamaño para el srcset responsive. */
  sizes?: string
  /** Clases del contenedor (define el aspect-ratio responsive). */
  className?: string
}

/**
 * Carrusel: TODAS las slides quedan montadas (sin recargas → sin parpadeo).
 * La actual está nítida y opaca debajo; la anterior se desvanece + desenfoca
 * por encima hasta revelarla (disolver suave). Accesible: con
 * `prefers-reduced-motion` no auto-rota ni anima.
 */
export function ImageCarousel({
  slides,
  interval = 5000,
  fade = 1.8,
  fit = 'cover',
  sizes = '50vw',
  className,
}: Props) {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [leaving, setLeaving] = useState<number | null>(null) // imagen que se está yendo
  const indexRef = useRef(0)

  // Cambia de imagen marcando la anterior para que se desvanezca por encima.
  const goTo = (next: number) => {
    if (next === indexRef.current) return
    if (!reduce) setLeaving(indexRef.current)
    indexRef.current = next
    setIndex(next)
  }

  // Si el conjunto de slides encoge (p. ej. al cambiar la variante de lente, que
  // puede tener menos fotos), el índice puede quedar fuera de rango y no habría
  // ninguna slide activa: el carrusel se vería en blanco.
  useEffect(() => {
    if (indexRef.current < slides.length) return
    indexRef.current = 0
    setIndex(0)
    setLeaving(null)
  }, [slides.length])

  useEffect(() => {
    if (reduce || slides.length <= 1) return
    const id = setInterval(() => {
      const next = (indexRef.current + 1) % slides.length
      setLeaving(indexRef.current)
      indexRef.current = next
      setIndex(next)
    }, interval)
    return () => clearInterval(id)
  }, [reduce, slides.length, interval])

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`} aria-roledescription="carrusel">
      {slides.map((slide, i) => {
        const isActive = i === index
        const isLeaving = i === leaving && i !== index
        return (
          <motion.div
            key={i}
            aria-hidden={!isActive}
            className="absolute inset-0"
            style={{ zIndex: isLeaving ? 3 : isActive ? 2 : 1 }}
            initial={false}
            animate={{
              opacity: isActive ? 1 : 0,
              filter: isLeaving ? 'blur(10px)' : 'blur(0px)',
            }}
            transition={isLeaving ? { duration: fade, ease: 'easeInOut' } : { duration: 0 }}
            onAnimationComplete={() => {
              if (isLeaving) setLeaving(null)
            }}
          >
            <Layer slide={slide} fit={fit} sizes={sizes} withAlt={isActive} />
          </motion.div>
        )
      })}

      {slides.length > 1 && (
        <div className="absolute bottom-3.5 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ver imagen ${i + 1}`}
              onClick={() => goTo(i)}
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
