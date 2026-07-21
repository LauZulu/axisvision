import type { StaticImageData } from 'next/image'

// ⚠️ CATÁLOGO DE PRUEBA (modo test) — 4 productos que REUTILIZAN las imágenes que
// ya viven en el repo (aún no hay fotos por producto). En la Fase 3 estos datos
// se sirven desde la DB; en el futuro las imágenes vendrán de S3.
import gafasFrente from '../assets/packaging/gafas-de-frente.jpeg'
import empaqueAbierto from '../assets/packaging/empaque-abierto-con-gafas.jpeg'
import heroProducto from '../assets/hero/hero-producto.jpeg'
import heroProducto02 from '../assets/hero/hero-producto-02.jpeg'
import modelo01 from '../assets/lifestyle/modelo-01.jpg'
import modelo02 from '../assets/lifestyle/modelo-02.jpg'
import modelo03 from '../assets/lifestyle/modelo-03.jpg'
import modelo05 from '../assets/lifestyle/modelo-05.jpeg'
import modelo07 from '../assets/lifestyle/modelo-07.jpeg'
import modelo08 from '../assets/lifestyle/modelo-08.jpeg'
import cafe from '../assets/retail/axis-en-cafe.jpg'
import cafe02 from '../assets/retail/axis-en-cafe-02.jpg'

/** Clave de edición — enlaza con el diccionario i18n `store.products[key]`. */
export type EditionKey = 'onyx' | 'aurum' | 'morpho' | 'clarum'

export type Product = {
  slug: string
  key: EditionKey
  /** Precio en pesos colombianos (COP). Para Wompi (Fase 7) se multiplicará ×100. */
  priceCop: number
  images: StaticImageData[]
}

export const PRODUCTS: Product[] = [
  {
    slug: 'axis-onyx',
    key: 'onyx',
    priceCop: 1_190_000,
    images: [gafasFrente, heroProducto, modelo01],
  },
  {
    slug: 'axis-aurum',
    key: 'aurum',
    priceCop: 1_390_000,
    images: [heroProducto02, modelo03, cafe],
  },
  {
    slug: 'axis-morpho',
    key: 'morpho',
    priceCop: 1_690_000,
    images: [empaqueAbierto, modelo05, modelo07],
  },
  {
    slug: 'axis-clarum',
    key: 'clarum',
    priceCop: 1_290_000,
    images: [modelo02, modelo08, cafe02],
  },
]

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug)
}

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

/** Formatea un precio en COP: 1190000 → "$1.190.000". */
export function formatCop(value: number): string {
  return copFormatter.format(value)
}
