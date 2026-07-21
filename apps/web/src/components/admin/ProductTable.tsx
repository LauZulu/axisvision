'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatCop, type ProductDTO } from '../../lib/products'

function StockBadge({ stock }: { stock: number }) {
  const tone =
    stock <= 0
      ? 'text-red-400 border-red-400/30'
      : stock <= 3
        ? 'text-gold border-gold/40'
        : 'text-warm-gray/70 border-line'
  return (
    <span className={`rounded-md border px-2 py-0.5 font-mono text-xs ${tone}`}>{stock}</span>
  )
}

export function ProductTable({ products }: { products: ProductDTO[] }) {
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

  async function remove(p: ProductDTO) {
    if (!confirm(`¿Dar de baja "${p.name}"? Dejará de verse en la tienda.`)) return
    setBusy(p.id)
    await fetch(`/api/admin/products/${p.id}`, { method: 'DELETE' })
    setBusy(null)
    router.refresh()
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-line bg-carbon-850 text-warm-gray/55">
          <tr>
            <th className="px-4 py-3 font-mono text-xs uppercase tracking-widest">Producto</th>
            <th className="px-4 py-3 font-mono text-xs uppercase tracking-widest">Precio</th>
            <th className="px-4 py-3 font-mono text-xs uppercase tracking-widest">Stock</th>
            <th className="px-4 py-3 font-mono text-xs uppercase tracking-widest">Estado</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-line/60 last:border-0">
              <td className="px-4 py-3">
                <div className="font-head text-warm-white">{p.name}</div>
                <div className="font-mono text-xs text-warm-gray/45">{p.slug}</div>
              </td>
              <td className="px-4 py-3 text-warm-gray/80">{formatCop(p.priceCop)}</td>
              <td className="px-4 py-3">
                <StockBadge stock={p.stock} />
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
                  {p.active ? 'Activo' : 'Oculto'}
                </button>
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <Link
                  href={`/admin/productos/${p.id}`}
                  className="text-sm text-warm-gray/70 transition-colors hover:text-gold"
                >
                  Editar
                </Link>
                <button
                  onClick={() => remove(p)}
                  disabled={busy === p.id}
                  className="ml-4 text-sm text-warm-gray/50 transition-colors hover:text-red-400 disabled:opacity-50"
                >
                  Baja
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
