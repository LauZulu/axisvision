// DTO de opción de lente, compartido entre servidor y cliente (sin imports de
// servidor → seguro en componentes cliente).
import type { ImageLensVariant, Lang } from './products'

/** `lens` = tipo de lente (excluyentes). `prescription` = complemento de fórmula. */
export type LensOptionKind = 'lens' | 'prescription'

export type LensOptionDTO = {
  id: string
  slug: string
  /** Qué pregunta del configurador responde esta opción. */
  kind: LensOptionKind
  nameEs: string
  nameEn: string
  descriptionEs: string
  descriptionEn: string
  /** Sobrecosto en COP sobre el precio del producto. 0 = incluido. */
  extraPriceCop: number
  /** Obliga a llevar fórmula médica (y a escribirla en el checkout). */
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

/**
 * El configurador son DOS preguntas independientes, no una lista de excluyentes:
 * qué lente lleva la montura, y si va con la fórmula del cliente. Estas dos
 * funciones parten el catálogo en esas dos preguntas.
 *
 * Nota de compatibilidad: las filas anteriores a la migración 5 no traen `kind`.
 * Se asume `lens`, que es lo que eran.
 */
export function lensTypes(options: LensOptionDTO[]): LensOptionDTO[] {
  return options.filter((o) => o.kind !== 'prescription')
}

/** El complemento de fórmula (una sola fila activa). null si no está en catálogo. */
export function prescriptionAddon(options: LensOptionDTO[]): LensOptionDTO | null {
  return options.find((o) => o.kind === 'prescription') ?? null
}

/** La opción de fábrica (o la primera) — la preseleccionada en la ficha. */
export function defaultLens(options: LensOptionDTO[]): LensOptionDTO | null {
  const types = lensTypes(options)
  return types.find((o) => o.isDefault) ?? types[0] ?? null
}

/**
 * Precio final de una unidad: producto + lente + fórmula (si la pidió).
 * Es solo para MOSTRAR — el cobro lo recalcula el servidor desde la DB.
 */
export function priceWithLens(
  priceCop: number,
  lens: LensOptionDTO | null,
  prescription: LensOptionDTO | null = null,
): number {
  return priceCop + (lens?.extraPriceCop ?? 0) + (prescription?.extraPriceCop ?? 0)
}

/**
 * Fotos que corresponden al lente elegido: las de esa variante más las neutras
 * (estuche, accesorios), que sirven para cualquiera.
 *
 * Solo mira el TIPO de lente: unas gafas de sol graduadas se ven como gafas de
 * sol, así que pedir la fórmula no cambia la galería.
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
