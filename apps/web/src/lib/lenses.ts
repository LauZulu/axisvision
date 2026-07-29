// DTO de opción de lente, compartido entre servidor y cliente (sin imports de
// servidor → seguro en componentes cliente).
import type { ImageLensVariant, Lang } from './products'

export type LensOptionDTO = {
  id: string
  slug: string
  nameEs: string
  nameEn: string
  descriptionEs: string
  descriptionEn: string
  /** Sobrecosto en COP sobre el precio del producto. 0 = incluido. */
  extraPriceCop: number
  /** Pide la fórmula médica en el checkout. */
  requiresPrescription: boolean
  /** El lente con el que vienen las gafas de fábrica. */
  isDefault: boolean
  active: boolean
  position: number
  /** Qué fotos del producto mostrar al elegir esta opción. */
  imageVariant: ImageLensVariant | null
}

export function lensName(o: LensOptionDTO, lang: Lang): string {
  return lang === 'en' ? o.nameEn : o.nameEs
}

export function lensDescription(o: LensOptionDTO, lang: Lang): string {
  return lang === 'en' ? o.descriptionEn : o.descriptionEs
}

/** La opción de fábrica (o la primera) — la preseleccionada en la ficha. */
export function defaultLens(options: LensOptionDTO[]): LensOptionDTO | null {
  return options.find((o) => o.isDefault) ?? options[0] ?? null
}

/** Precio final de una unidad: producto + lente elegido. */
export function priceWithLens(priceCop: number, lens: LensOptionDTO | null): number {
  return priceCop + (lens?.extraPriceCop ?? 0)
}

/**
 * Fotos que corresponden al lente elegido: las de esa variante más las neutras
 * (estuche, accesorios), que sirven para cualquiera.
 *
 * Si el producto no tiene fotos de esa variante — Crystal solo se fotografió con
 * lente transparente, Apex no tiene fotos con fórmula — cae a UNA sola variante
 * alternativa (la de sol primero). Nunca mezcla variantes distintas en la misma
 * galería: ver el mismo modelo con dos lentes seguidos se lee como un error.
 */
export function imagesForLens<T extends { lensVariant: ImageLensVariant | null }>(
  images: T[],
  lens: LensOptionDTO | null,
): T[] {
  const of = (v: ImageLensVariant | null) => images.filter((i) => i.lensVariant === v)
  const neutral = of(null)

  const wanted = lens?.imageVariant ?? null
  const candidates: (ImageLensVariant | null)[] = [wanted, 'sunglass', 'ophthalmic', 'yellow']

  for (const variant of candidates) {
    if (!variant) continue
    const matching = of(variant)
    if (matching.length > 0) return [...matching, ...neutral]
  }
  // Producto sin variantes marcadas (fotos antiguas): se muestran todas.
  return images
}
