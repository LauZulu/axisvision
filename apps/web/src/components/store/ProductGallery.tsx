'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { Icon } from '../ui/Icon'
import { lensTintBackground } from '../../lib/lenses'

export type GallerySlide = {
  src: string
  alt: string
  /** Silueta del lente (`data:` URI). Sin ella la foto no se tiñe. */
  mask?: string | null
}

/**
 * Galería de la ficha de producto. A diferencia del `<ImageCarousel>` de la
 * landing, aquí NO auto-rota: en la ficha el cliente está leyendo y decidiendo,
 * y una foto que se cambia sola le mueve el suelo mientras compara lentes.
 *
 * A cambio, todas las fotos están a la vista en la tira de miniaturas: se llega
 * a cualquiera de un clic en vez de esperar el turno de la rotación.
 *
 * Todas las slides quedan montadas y se cruzan por opacidad (sin recargas → sin
 * parpadeo).
 *
 * Tamaño de la foto grande, por tramos:
 *  - `lg` (dos columnas): manda la ALTURA, para que la columna entera quepa en
 *    un portátil y el `sticky` del padre sirva de algo.
 *  - por debajo (una columna): la proporción es 4/5, pero con dos topes. El de
 *    alto (`max-h`) porque a ancho completo en un móvil son ~430px de foto —
 *    casi dos tercios de la pantalla— antes de que aparezca ni el nombre del
 *    modelo; recorta arriba y abajo, que en estas fotos es fondo vacío. El de
 *    ancho (`max-w`) para la tablet: sin él la foto ocupaba los 688px de ancho
 *    y el tope de alto la dejaba en una franja apaisada de 1.8:1, que de una
 *    foto vertical de gafas enseña poco más que las lentes.
 *
 * `min-w-0` es obligatorio: la tira de miniaturas no cabe a lo ancho en móvil y
 * sin él su min-content estira la columna del padre y desborda la página — así
 * se salía de la pantalla la ficha entera, no solo la galería.
 */
export function ProductGallery({
  slides,
  tint,
  className,
}: {
  slides: GallerySlide[]
  /**
   * Color con el que se simula el lente elegido cuando no hay foto real de él
   * (`galleryForLens`). Se pinta como una capa `multiply` recortada por la
   * máscara de cada foto, así que las que no la traen salen intactas.
   */
  tint?: string | null
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
    <div className={`min-w-0 ${className ?? ''}`}>
      <div className="group relative mx-auto w-full max-w-[26rem] overflow-hidden rounded-2xl border border-line bg-carbon-900 aspect-[4/5] max-h-[min(52vh,24rem)] lg:mx-0 lg:aspect-auto lg:max-h-none lg:max-w-none lg:h-[min(64vh,38rem)]">
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
            <LensTint tint={tint} mask={slide.mask} />
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
        // El mismo `max-w` que la foto grande, para que la tira quede alineada
        // con ella y no arrancando a su izquierda cuando la foto va centrada.
        <div className="mt-3 mx-auto flex w-full max-w-[26rem] gap-2 overflow-x-auto pb-1 lg:mx-0 lg:max-w-none lg:flex-wrap lg:overflow-x-visible">
          {slides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver foto ${i + 1} de ${slides.length}`}
              aria-current={i === index}
              // Pequeñas a propósito: en `lg` para que las 7 fotos de un modelo
              // quepan en UNA fila y la foto grande se lleve el alto restante, y
              // en móvil para que se vea que hay más a la derecha (con 64px la
              // sexta quedaba justo en el borde y parecía el final de la tira).
              className={`relative aspect-square w-14 shrink-0 overflow-hidden rounded-lg border transition-colors ${
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
              <LensTint tint={tint} mask={slide.mask} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * La capa de color que convierte la foto del lente transparente en la del lente
 * elegido. Va encima de la foto, en `mix-blend-mode: multiply` para que el logo
 * grabado, el borde interior del aro y el reflejo del cristal sigan viéndose a
 * través del color en vez de quedar tapados por un relleno liso.
 *
 * `mask-size: cover` NO es intercambiable con `100% 100%`: la foto se pinta con
 * `object-cover`, o sea recortada al alto del contenedor, y una máscara
 * estirada al 100% se desalinea con ella —medio lente sin teñir y una franja de
 * color sobre el armazón—. `cover` + `center` reproduce exactamente el recuadro
 * que hace `object-cover object-center`.
 *
 * `isolation: isolate` en el padre no vale aquí: la capa tiene que mezclarse
 * con la foto, que es su hermana en el mismo contexto de apilado.
 */
function LensTint({ tint, mask }: { tint?: string | null; mask?: string | null }) {
  if (!tint || !mask) return null
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background: lensTintBackground(tint),
        mixBlendMode: 'multiply',
        WebkitMaskImage: `url(${mask})`,
        maskImage: `url(${mask})`,
        WebkitMaskSize: 'cover',
        maskSize: 'cover',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
      }}
    />
  )
}
