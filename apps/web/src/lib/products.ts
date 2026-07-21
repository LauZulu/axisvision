// DTO de producto compartido entre servidor (lo arma desde la DB) y cliente (lo
// consume). Sin imports de servidor → seguro de importar en componentes cliente.
export type Lang = 'es' | 'en'

export type ProductImageDTO = { key: string; position: number }

export type ProductDTO = {
  id: string
  slug: string
  name: string
  taglineEs: string
  taglineEn: string
  descriptionEs: string
  descriptionEn: string
  priceCop: number
  currency: string
  stock: number
  active: boolean
  position: number
  images: ProductImageDTO[]
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
