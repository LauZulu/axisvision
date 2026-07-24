'use client'

import Link from 'next/link'
import { useDict } from '../../i18n/useDict'
import { ProductTable } from './ProductTable'
import type { ProductDTO } from '../../lib/products'

export function ProductsView({ products }: { products: ProductDTO[] }) {
  const { t } = useDict()
  const p = t.admin.products
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-head text-2xl text-warm-white">{p.title}</h1>
          <p className="mt-1 text-warm-gray/60">{p.subtitle}</p>
        </div>
        <Link href="/admin/productos/nuevo" className="btn-axis">
          {p.new}
        </Link>
      </div>
      <div className="mt-8">
        <ProductTable products={products} />
      </div>
    </div>
  )
}
