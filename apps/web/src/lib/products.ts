// DTO de producto compartido entre servidor (lo arma desde la DB) y cliente (lo
// consume). Sin imports de servidor → seguro de importar en componentes cliente.
export type Lang = 'es' | 'en'

// `url` = ruta pública de CloudFront cuando la imagen vive en S3; `null` para las
// imágenes locales de prueba (el frontend las resuelve con el asset del repo).
export type ProductImageDTO = { key: string; url: string | null; position: number }

export type ProductDTO = {
  id: string
  slug: string
  name: string
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
