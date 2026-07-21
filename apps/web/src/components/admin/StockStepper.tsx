'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Ajuste rápido de stock con guardado inmediato (PATCH). Para el día a día:
 * −1 al vender, +N al reponer. Optimista + refresh para actualizar KPIs.
 */
export function StockStepper({
  productId,
  stock: initial,
  size = 'md',
}: {
  productId: string
  stock: number
  size?: 'sm' | 'md'
}) {
  const router = useRouter()
  const [stock, setStock] = useState(initial)
  const [saving, setSaving] = useState(false)

  async function save(next: number) {
    const value = Math.max(0, Math.floor(next) || 0)
    setStock(value)
    setSaving(true)
    try {
      await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ stock: value }),
      })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const btn =
    'grid place-items-center rounded-md border border-line text-warm-gray/80 transition-colors hover:border-gold/50 hover:text-gold disabled:opacity-40'
  const dim = size === 'sm' ? 'h-7 w-7 text-sm' : 'h-8 w-8'
  const inputDim = size === 'sm' ? 'h-7 w-12 text-sm' : 'h-8 w-14'

  return (
    <div className={`inline-flex items-center gap-1.5 ${saving ? 'opacity-60' : ''}`}>
      <button type="button" onClick={() => save(stock - 1)} disabled={saving || stock <= 0} className={`${btn} ${dim}`} aria-label="Restar 1">
        −
      </button>
      <input
        type="number"
        min={0}
        value={stock}
        onChange={(e) => setStock(Number(e.target.value))}
        onBlur={() => stock !== initial && save(stock)}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className={`${inputDim} rounded-md border border-line bg-carbon-900 text-center font-mono text-warm-white outline-none focus:border-gold/60`}
      />
      <button type="button" onClick={() => save(stock + 1)} disabled={saving} className={`${btn} ${dim}`} aria-label="Sumar 1">
        +
      </button>
    </div>
  )
}
