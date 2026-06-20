type Props = {
  /** Imagen importada con `?picture` (ver vite.config.ts / images.d.ts). */
  picture: ResponsivePicture
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
 * Imagen responsive: emite AVIF/WebP/original con `srcset` y srcset por ancho.
 * Lleva `width`/`height` intrínsecos para no provocar saltos de layout (CLS).
 * El `<picture>` usa `display:contents`, así el `<img>` controla el layout.
 */
export function Img({ picture, alt, className, sizes = '100vw', priority = false }: Props) {
  const { sources, img } = picture
  return (
    <picture style={{ display: 'contents' }}>
      {Object.entries(sources).map(([format, srcset]) => (
        <source key={format} type={`image/${format}`} srcSet={srcset} sizes={sizes} />
      ))}
      <img
        src={img.src}
        width={img.w}
        height={img.h}
        alt={alt}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        className={className}
      />
    </picture>
  )
}
