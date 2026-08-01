'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { Icon } from '../ui/Icon'

export type GallerySlide = { src: string; alt: string }

/**
 * Galería de la ficha de producto. A diferencia del `<ImageCarousel>` de la
 * landing, aquí NO auto-rota: en la ficha el cliente está leyendo y decidiendo,
 * y una foto que se cambia sola le mueve el suelo mientras compara lentes.
 *
 * A cambio, todas las fotos están a la vista en la tira de miniaturas: se llega
 * a cualquiera de un clic en vez de esperar el turno de la rotación.
 *
 * Todas las slides quedan montadas y se cruzan por opacidad (sin recargas → sin
 * parpadeo). En `lg` la altura manda sobre la proporción para que la columna
 * entera quepa en pantalla de portátil y el `sticky` del padre sirva de algo.
 */
export function ProductGallery({
  slides,
  className,
}: {
  slides: GallerySlide[]
  className?: string
}) {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)
  const cover = slides[0]?.src

  // Al cambiar de lente el conjunto de fotos cambia (y puede encoger): sin esto
  // el índice quedaría fuera de rango y la galería se vería en blanco.
  useEffect(() => {
    setIndex(0)
  }, [slides.length, cover])

  if (slides.length === 0) return null

  const go = (delta: number) => setIndex((i) => (i + delta + slides.length) % slides.length)

  return (
    <div className={className}>
      <div className="group relative w-full overflow-hidden rounded-2xl border border-line bg-carbon-900 aspect-[4/5] lg:aspect-auto lg:h-[min(64vh,38rem)]">
        {slides.map((slide, i) => (
          <motion.div
            key={slide.src}
            aria-hidden={i !== index}
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: i === index ? 1 : 0 }}
            transition={{ duration: reduce ? 0 : 0.45, ease: 'easeInOut' }}
            style={{ zIndex: i === index ? 2 : 1 }}
          >
            <Image
              src={slide.src}
              alt={i === index ? slide.alt : ''}
              fill
              sizes="(min-width: 1024px) 52vw, 92vw"
              priority={i === 0}
              className="object-cover object-center"
            />
          </motion.div>
        ))}

        {/* Flechas discretas: solo aparecen al pasar el cursor, para no añadir
            ruido permanente sobre la foto. En táctil manda la tira de abajo. */}
        {slides.length > 1 && (
          <div className="pointer-events-none absolute inset-0 z-10 hidden items-center justify-between px-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 lg:flex">
            {([-1, 1] as const).map((delta) => (
              <button
                key={delta}
                type="button"
                onClick={() => go(delta)}
                aria-label={delta < 0 ? 'Anterior' : 'Siguiente'}
                className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full border border-warm-white/20 bg-carbon-900/70 text-warm-white/80 backdrop-blur-sm transition-colors hover:border-gold/60 hover:text-gold"
              >
                <Icon name="arrow" size={16} className={delta < 0 ? 'rotate-180' : undefined} />
              </button>
            ))}
          </div>
        )}
      </div>

      {slides.length > 1 && (
        // En escritorio envuelven en varias filas: el objetivo es ver TODAS las
        // fotos de un vistazo, y una tira recortada esconde justo las últimas.
        // En móvil no cabe una rejilla, así que ahí sí se desliza.
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-x-visible">
          {slides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver foto ${i + 1} de ${slides.length}`}
              aria-current={i === index}
              // En `lg` van más pequeñas para que las 7 fotos de un modelo
              // quepan en UNA fila y la foto grande se lleve el alto restante.
              className={`relative aspect-square w-16 shrink-0 overflow-hidden rounded-lg border transition-colors lg:w-14 ${
                i === index ? 'border-gold' : 'border-line hover:border-gold/50'
              }`}
            >
              <Image
                src={slide.src}
                alt=""
                fill
                sizes="72px"
                className={`object-cover transition-opacity ${i === index ? 'opacity-100' : 'opacity-65 hover:opacity-100'}`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
