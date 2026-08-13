// DTO de opción de lente, compartido entre servidor y cliente (sin imports de
// servidor → seguro en componentes cliente).
import { formatCop, type ImageLensVariant, type Lang } from './products'

/**
 * `lens` = tipo de lente (excluyentes). `prescription` = complemento de fórmula.
 * `coating` = antirreflejo, que se monta sobre cualquiera de los lentes.
 */
export type LensOptionKind = 'lens' | 'prescription' | 'coating'

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
  /**
   * El precio se confirma después de la compra y NO se cobra en el checkout
   * (la fórmula médica: el valor depende de la graduación, que llega después).
   * Distinto de `extraPriceCop === 0`, que significa "incluido, sin costo".
   */
  priceOnQuote: boolean
  /** Obliga a llevar fórmula médica (y a escribirla en el checkout). */
  requiresPrescription: boolean
  /**
   * Solo en las filas `lens`: qué cuesta añadirle el ANTIRREFLEJO a este lente.
   * `null` = ya lo trae puesto. Vive en el lente y no en la fila del
   * complemento porque el AR no cuesta lo mismo sobre cada uno (ver la
   * migración 010).
   */
  arExtraPriceCop: number | null
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

/** Lo que se cobra por esta opción. Las de precio por confirmar cobran 0. */
export function lensExtraCop(o: LensOptionDTO | null | undefined): number {
  if (!o || o.priceOnQuote) return 0
  return o.extraPriceCop
}

/**
 * Qué se escribe donde va el precio de una opción. Son TRES estados, no dos, y
 * confundirlos cuesta caro: "incluido" (sin costo), un sobrecosto concreto, y
 * "por confirmar" — la fórmula médica, cuyo valor depende de la graduación que
 * el cliente manda después de comprar. Sin este tercer estado el cero se leería
 * como gratis.
 */
export function lensPriceLabel(
  o: LensOptionDTO,
  labels: { included: string; onQuote: string },
): string {
  if (o.priceOnQuote) return labels.onQuote
  return o.extraPriceCop > 0 ? `+ ${formatCop(o.extraPriceCop)}` : labels.included
}

/**
 * El configurador son TRES preguntas independientes, no una lista de
 * excluyentes: qué lente lleva la montura, si le va el antirreflejo, y si va
 * con la fórmula del cliente. Estas funciones parten el catálogo en esas tres.
 *
 * Nota de compatibilidad: las filas anteriores a la migración 5 no traen `kind`.
 * Se asume `lens`, que es lo que eran.
 */
export function lensTypes(options: LensOptionDTO[]): LensOptionDTO[] {
  return options.filter((o) => o.kind !== 'prescription' && o.kind !== 'coating')
}

/** El complemento de antirreflejo (una sola fila activa). */
export function coatingAddon(options: LensOptionDTO[]): LensOptionDTO | null {
  return options.find((o) => o.kind === 'coating') ?? null
}

/**
 * Qué cuesta añadirle el antirreflejo al lente elegido. `null` = ese lente ya
 * lo trae, así que va incluido y sin costo (y la casilla se muestra fija).
 *
 * Es una función y no un campo del complemento a propósito: el precio depende
 * del LENTE (+20.000 sobre el transparente, +70.000 sobre el fotocromático,
 * incluido en el filtro azul), no del complemento.
 */
export function coatingPriceFor(lens: LensOptionDTO | null): number | null {
  return lens?.arExtraPriceCop ?? null
}

/** true si el lente elegido ya trae el antirreflejo puesto. */
export function coatingIncludedIn(lens: LensOptionDTO | null): boolean {
  return Boolean(lens && lens.arExtraPriceCop === null)
}

/**
 * Las opciones que ofrece un modelo concreto.
 *
 * `lensOptionIds` vacío significa "las ofrece todas" — es el caso normal, y el
 * default seguro: un modelo nuevo al que se le olvide marcar lentes sale con
 * todos, no sin ninguno. La lista solo existe para las excepciones (Apex, la
 * deportiva, que tiene un único lente y la ficha le ofrecía transitions).
 *
 * Filtra los tres tipos de fila: un modelo puede no admitir fórmula, o no
 * ofrecer el antirreflejo.
 */
export function optionsForProduct(
  options: LensOptionDTO[],
  lensOptionIds: string[] | undefined,
): LensOptionDTO[] {
  if (!lensOptionIds || lensOptionIds.length === 0) return options
  const allowed = new Set(lensOptionIds)
  const filtered = options.filter((o) => allowed.has(o.id))
  // Si la lista quedó sin ningún lente (opciones borradas o desactivadas), se
  // vuelve al catálogo completo: mejor ofrecer de más que dejar la ficha sin
  // forma de elegir lente y, con ella, sin forma de comprar.
  return lensTypes(filtered).length > 0 ? filtered : options
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
