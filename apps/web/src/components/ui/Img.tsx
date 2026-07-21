import Image, { type StaticImageData } from 'next/image'

type Props = {
  /** Imagen importada estáticamente (Next genera AVIF/WebP + srcset y las dimensiones intrínsecas). */
  picture: StaticImageData
  /** Texto alternativo (pásalo traducido desde i18n). */
  alt: string
  /** Clases para el `<img>` visible (tamaño, object-fit, etc.). */
  className?: string
  /** Hint de tamaño para que el navegador elija el ancho correcto del srcset. */
  sizes?: string
  /**
   * `true` solo para la imagen principal del hero (LCP): carga eager,
   * alta prioridad y sin lazy. El resto va lazy por defecto.
   */
  priority?: boolean
}

/**
 * Imagen responsive sobre `next/image`: emite AVIF/WebP con `srcset`, lleva
 * `width`/`height` intrínsecos (cero CLS) y va lazy salvo `priority` (hero/LCP).
 * El `<img>` respeta las clases de layout (aspect-ratio + object-fit) igual que antes;
 * el reset de Tailwind (`img { height: auto }`) deja que las clases gobiernen el tamaño.
 */
export function Img({ picture, alt, className, sizes = '100vw', priority = false }: Props) {
  return (
    <Image
      src={picture}
      alt={alt}
      sizes={sizes}
      priority={priority}
      className={className}
    />
  )
}
