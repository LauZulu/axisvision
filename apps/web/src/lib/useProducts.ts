import { useEffect, useState } from 'react'
import type { ProductDTO } from './products'

// Caché a nivel de módulo: Collection y CompareModels comparten UNA sola
// petición a /api/products aunque se monten por separado.
let cache: ProductDTO[] | null = null
let inflight: Promise<ProductDTO[]> | null = null

function load(): Promise<ProductDTO[]> {
  if (cache) return Promise.resolve(cache)
  inflight ??= fetch('/api/products')
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((d: { products?: ProductDTO[] }) => {
      cache = Array.isArray(d.products) ? d.products : []
      return cache
    })
    .catch(() => {
      inflight = null
      return [] as ProductDTO[]
    })
  return inflight
}

/**
 * Catálogo para la landing. `null` mientras carga; `[]` si la API falla
 * (las secciones muestran entonces figuras preparadas sin precio).
 */
export function useProducts(): ProductDTO[] | null {
  const [products, setProducts] = useState<ProductDTO[] | null>(cache)

  useEffect(() => {
    let alive = true
    void load().then((p) => {
      if (alive) setProducts(p)
    })
    return () => {
      alive = false
    }
  }, [])

  return products
}
