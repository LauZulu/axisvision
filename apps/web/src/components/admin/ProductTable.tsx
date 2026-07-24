'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { formatCop, type ProductDTO } from '../../lib/products'
import { resolveProductSrc } from '../../lib/productImages'
import { fill } from '../../lib/format'
import { useDict } from '../../i18n/useDict'
import { StockStepper } from './StockStepper'

export function ProductTable({ products }: { products: ProductDTO[] }) {
  const { t } = useDict()
  const p2 = t.admin.products
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  async function toggleActive(p: ProductDTO) {
    setBusy(p.id)
    await fetch(`/api/admin/products/${p.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ active: !p.active }),
    })
    setBusy(null)
    router.refresh()
  }

  async function hardDelete(p: ProductDTO) {
    if (!confirm(fill(p2.deleteConfirm, { name: p.name }))) return
    setBusy(p.id)
    await fetch(`/api/admin/products/${p.id}?mode=hard`, { method: 'DELETE' })
    setBusy(null)
    router.refresh()
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-line bg-carbon-850 text-warm-gray/55">
          <tr>
            <th className="px-4 py-3 font-mono text-xs uppercase tracking-widest">{p2.colProduct}</th>
            <th className="px-4 py-3 font-mono text-xs uppercase tracking-widest">{p2.colPrice}</th>
            <th className="px-4 py-3 font-mono text-xs uppercase tracking-widest">{p2.colStock}</th>
            <th className="px-4 py-3 font-mono text-xs uppercase tracking-widest">{p2.colStatus}</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-line/60 last:border-0">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-line bg-carbon-900">
                    <Image
                      src={resolveProductSrc(p.images[0] ?? { key: '', url: null })}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-head text-warm-white">{p.name}</div>
                    <div className="font-mono text-xs text-warm-gray/45">{p.slug}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-warm-gray/80">{formatCop(p.priceCop)}</td>
              <td className="px-4 py-3">
                <StockStepper productId={p.id} stock={p.stock} size="sm" />
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => toggleActive(p)}
                  disabled={busy === p.id}
                  className={`rounded-full px-2.5 py-0.5 text-xs transition-colors disabled:opacity-50 ${
                    p.active
                      ? 'bg-gold/15 text-gold hover:bg-gold/25'
                      : 'bg-carbon-800 text-warm-gray/50 hover:text-warm-gray'
                  }`}
                >
                  {p.active ? p2.active : p2.hidden}
                </button>
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <Link
                  href={`/admin/productos/${p.id}`}
                  className="text-sm text-warm-gray/70 transition-colors hover:text-gold"
                >
                  {p2.edit}
                </Link>
                <button
                  onClick={() => hardDelete(p)}
                  disabled={busy === p.id}
                  className="ml-4 text-sm text-warm-gray/50 transition-colors hover:text-red-400 disabled:opacity-50"
                >
                  {p2.delete}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
