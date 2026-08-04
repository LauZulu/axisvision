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

/**
 * Catálogo del admin. En móvil NO es una tabla con scroll horizontal: cada
 * producto es una ficha. Una tabla de 720px dentro de una pantalla de 430
 * obliga a arrastrar de lado para ver el precio y el botón de editar, y es
 * justo lo que se hace a diario desde el teléfono.
 */
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

  const thumb = (p: ProductDTO, size: number) => (
    <div
      className="relative shrink-0 overflow-hidden rounded-lg border border-line bg-carbon-900"
      style={{ height: size, width: size }}
    >
      <Image
        src={resolveProductSrc(p.images[0] ?? { key: '', url: null })}
        alt=""
        fill
        sizes={`${size}px`}
        className="object-cover"
      />
    </div>
  )

  const stockCell = (p: ProductDTO) =>
    // Con inventario por unidad el stock es derivado: no se teclea,
    // se gestiona moviendo unidades en /admin/inventario.
    (p.unitsTotal ?? 0) > 0 ? (
      <Link
        href={`/admin/inventario?producto=${p.slug}`}
        className="inline-flex items-baseline gap-1.5 transition-colors hover:text-gold"
        title={p2.colStock}
      >
        <span className="font-mono text-warm-white">{p.stock}</span>
        <span className="font-mono text-xs text-warm-gray/45">/ {p.unitsTotal}</span>
      </Link>
    ) : (
      <StockStepper productId={p.id} stock={p.stock} size="sm" />
    )

  const statusButton = (p: ProductDTO) => (
    <button
      onClick={() => toggleActive(p)}
      disabled={busy === p.id}
      className={`rounded-full px-2.5 py-1 text-xs transition-colors disabled:opacity-50 ${
        p.active
          ? 'bg-gold/15 text-gold hover:bg-gold/25'
          : 'bg-carbon-800 text-warm-gray/50 hover:text-warm-gray'
      }`}
    >
      {p.active ? p2.active : p2.hidden}
    </button>
  )

  return (
    <>
      {/* Móvil: una ficha por producto */}
      <ul className="space-y-3 md:hidden">
        {products.map((p) => (
          <li key={p.id} className="rounded-2xl border border-line bg-carbon-850 p-4">
            <div className="flex items-start gap-3">
              {thumb(p, 56)}
              <div className="min-w-0 flex-1">
                <div className="truncate font-head text-warm-white">{p.name}</div>
                <div className="truncate font-mono text-xs text-warm-gray/45">
                  {p.modelCode ?? p.slug}
                  {p.size && <span className="ml-2">· {p.size}</span>}
                </div>
              </div>
              {statusButton(p)}
            </div>

            <dl className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <div>
                <dt className="font-mono text-[0.6rem] uppercase tracking-widest text-warm-gray/45">
                  {p2.colPrice}
                </dt>
                <dd className="mt-0.5 text-warm-gray/85">{formatCop(p.priceCop)}</dd>
              </div>
              <div>
                <dt className="font-mono text-[0.6rem] uppercase tracking-widest text-warm-gray/45">
                  {p2.colStock}
                </dt>
                <dd className="mt-0.5">{stockCell(p)}</dd>
              </div>
            </dl>

            <div className="mt-4 flex items-center gap-2 border-t border-line/60 pt-3">
              <Link
                href={`/admin/productos/${p.id}`}
                className="flex-1 rounded-md border border-line py-2 text-center text-sm text-warm-gray/80 transition-colors hover:border-gold/50 hover:text-gold"
              >
                {p2.edit}
              </Link>
              <button
                onClick={() => hardDelete(p)}
                disabled={busy === p.id}
                className="rounded-md border border-line px-4 py-2 text-sm text-warm-gray/55 transition-colors hover:border-red-400/50 hover:text-red-400 disabled:opacity-50"
              >
                {p2.delete}
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Escritorio: la tabla de siempre */}
      <div className="hidden overflow-x-auto rounded-2xl border border-line md:block">
        <table className="w-full text-left text-sm">
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
                    {thumb(p, 48)}
                    <div className="min-w-0">
                      <div className="truncate font-head text-warm-white">{p.name}</div>
                      <div className="font-mono text-xs text-warm-gray/45">
                        {p.modelCode ?? p.slug}
                        {p.size && <span className="ml-2">· {p.size}</span>}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-warm-gray/80">{formatCop(p.priceCop)}</td>
                <td className="px-4 py-3">{stockCell(p)}</td>
                <td className="px-4 py-3">{statusButton(p)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
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
    </>
  )
}
