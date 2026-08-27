// DTO de producto compartido entre servidor (lo arma desde la DB) y cliente (lo
// consume). Sin imports de servidor → seguro de importar en componentes cliente.
export type Lang = 'es' | 'en'

// `url` = ruta pública de CloudFront cuando la imagen vive en S3; `null` para las
// imágenes locales de prueba (el frontend las resuelve con el asset del repo).
/**
 * `transitions` y `blue` no tienen fotos: existen para que esas opciones no
 * compartan variante con el lente transparente y puedan caer en el tinte.
 */
export type ImageLensVariant = 'sunglass' | 'ophthalmic' | 'yellow' | 'transitions' | 'blue'

export type ProductImageDTO = {
  key: string
  url: string | null
  position: number
  /** Con qué lente se tomó. null = sirve para cualquiera (estuche, accesorios). */
  lensVariant: ImageLensVariant | null
  /**
   * Silueta del lente como `data:` URI (WebP alfa, ~1,2 KB). Con ella la ficha
   * puede TEÑIR esta foto y ahorrarse una variante por cada tipo de lente.
   * `null` = no se puede teñir (es lo normal: solo las fotos de lente
   * transparente la tienen).
   */
  mask: string | null
}

/** Talla del armazón (define la banda de precio). */
export type ProductSize = 'chico' | 'mediano' | 'grande'

export type ProductDTO = {
  id: string
  slug: string
  name: string
  /** Código de modelo del inventario ("M02"). Llave contra el Excel del cliente. */
  modelCode: string | null
  size: ProductSize | null
  taglineEs: string
  taglineEn: string
  descriptionEs: string
  descriptionEn: string
  priceCop: number
  /** Precio "anterior" (tachado). Solo hay descuento si es > priceCop. */
  compareAtPriceCop: number | null
  currency: string
  stock: number
  active: boolean
  position: number
  images: ProductImageDTO[]
  /**
   * Opciones de lente que ofrece ESTE modelo. **Vacío = las ofrece todas**, que
   * es el caso de casi todo el catálogo: la lista solo existe para el modelo
   * que es la excepción (Apex, deportiva, con un único lente). Resolverlo con
   * `optionsForProduct()` en src/lib/lenses.ts, nunca a mano.
   */
  lensOptionIds: string[]
  /**
   * Unidades físicas cargadas en el inventario (todas, no solo las disponibles).
   * Solo se rellena en las consultas del admin. Si es > 0, `stock` es DERIVADO y
   * no debe editarse a mano.
   */
  unitsTotal?: number
}

/** Descuento activo: hay precio anterior y es mayor al precio actual. */
export function hasDiscount(p: Pick<ProductDTO, 'priceCop' | 'compareAtPriceCop'>): boolean {
  return p.compareAtPriceCop !== null && p.compareAtPriceCop > p.priceCop
}

/** Porcentaje de descuento redondeado (p. ej. 15). */
export function discountPct(p: Pick<ProductDTO, 'priceCop' | 'compareAtPriceCop'>): number {
  if (!hasDiscount(p)) return 0
  return Math.round((1 - p.priceCop / p.compareAtPriceCop!) * 100)
}

export function productTagline(p: ProductDTO, lang: Lang): string {
  return lang === 'en' ? p.taglineEn : p.taglineEs
}

export function productDescription(p: ProductDTO, lang: Lang): string {
  return lang === 'en' ? p.descriptionEn : p.descriptionEs
}

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

/** Formatea un precio en COP: 1190000 → "$ 1.190.000". */
export function formatCop(value: number): string {
  return copFormatter.format(value)
}

export const inStock = (p: ProductDTO): boolean => p.stock > 0
