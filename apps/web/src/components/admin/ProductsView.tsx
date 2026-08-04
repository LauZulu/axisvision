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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-head text-xl text-warm-white sm:text-2xl">{p.title}</h1>
          <p className="mt-1 text-sm text-warm-gray/60 sm:text-base">{p.subtitle}</p>
        </div>
        <Link href="/admin/productos/nuevo" className="btn-axis w-full sm:w-auto">
          {p.new}
        </Link>
      </div>
      <div className="mt-6 sm:mt-8">
        <ProductTable products={products} />
      </div>
    </div>
  )
}
