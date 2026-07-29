'use client'

import { useMemo, useState } from 'react'
import { useDict } from '../../i18n/useDict'
import { fill } from '../../lib/format'
import type { ProductUnitDTO } from '../../server/inventory'

type UnitLocation = ProductUnitDTO['location']

const LOCATIONS: UnitLocation[] = ['casa', 'local', 'fds', 'sold']

/**
 * Inventario por unidad física. Cada fila es una gafa real (serial AX01…).
 * Mover una unidad de ubicación o marcarla no vendible recalcula el stock del
 * producto en el servidor — por eso se guarda al vuelo, sin botón.
 */
export function InventoryView({ units: initial }: { units: ProductUnitDTO[] }) {
  const { t } = useDict()
  const inv = t.admin.inventory
  const [units, setUnits] = useState(initial)
  const [model, setModel] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const models = useMemo(
    () => [...new Map(units.map((u) => [u.productId, u.productName])).entries()],
    [units],
  )

  const visible = model ? units.filter((u) => u.productId === model) : units
  const sellableCount = visible.filter(
    (u) => u.sellable && (u.location === 'casa' || u.location === 'local'),
  ).length

  const locationLabel: Record<UnitLocation, string> = {
    fds: inv.locFds,
    casa: inv.locCasa,
    local: inv.locLocal,
    sold: inv.locSold,
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setSavingId(id)
    setError(null)
    // Optimista: la tabla responde al instante y se revierte si el PATCH falla.
    const before = units
    setUnits((list) => list.map((u) => (u.id === id ? { ...u, ...body } : u)))
    try {
      const res = await fetch(`/api/admin/units/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        setUnits(before)
        setError(inv.saveError)
      }
    } catch {
      setUnits(before)
      setError(inv.saveError)
    }
    setSavingId(null)
  }

  return (
    <div>
      <h1 className="font-head text-2xl text-warm-white">{inv.title}</h1>
      <p className="mt-1 text-warm-gray/60">{inv.subtitle}</p>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="rounded-md border border-line bg-carbon-900 px-3 py-2 text-sm text-warm-white outline-none focus:border-gold/60"
        >
          <option value="">{inv.filterAll}</option>
          {models.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <span className="font-mono text-xs tracking-wide text-warm-gray/60">
          {fill(inv.summary, { sellable: sellableCount, total: visible.length })}
        </span>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {visible.length === 0 ? (
        <p className="mt-10 text-warm-gray/60">{inv.empty}</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[52rem] text-sm">
            <thead className="bg-carbon-900 text-left font-mono text-[0.7rem] tracking-widest text-warm-gray/60">
              <tr>
                <th className="px-4 py-3">{inv.code}</th>
                <th className="px-4 py-3">{inv.model}</th>
                <th className="px-4 py-3">{inv.unit}</th>
                <th className="px-4 py-3">{inv.lensType}</th>
                <th className="px-4 py-3">{inv.location}</th>
                <th className="px-4 py-3">{inv.sellable}</th>
                <th className="px-4 py-3">{inv.note}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {visible.map((u) => (
                <tr
                  key={u.id}
                  className={`transition-opacity ${savingId === u.id ? 'opacity-50' : ''}`}
                >
                  <td className="px-4 py-2.5 font-mono text-warm-white">{u.code}</td>
                  <td className="px-4 py-2.5 text-warm-gray/85">
                    {u.productName}
                    {u.modelCode && (
                      <span className="ml-2 font-mono text-[0.7rem] text-warm-gray/45">
                        {u.modelCode}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-warm-gray/60">{u.unitNumber}</td>
                  <td className="px-4 py-2.5 text-warm-gray/70">
                    {u.lensType === 'ophthalmic' ? inv.lensOphthalmic : inv.lensSun}
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      value={u.location}
                      onChange={(e) => patch(u.id, { location: e.target.value })}
                      className="rounded-md border border-line bg-carbon-900 px-2 py-1.5 text-sm text-warm-white outline-none focus:border-gold/60"
                    >
                      {LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>
                          {locationLabel[loc]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={u.sellable}
                      onChange={(e) => patch(u.id, { sellable: e.target.checked })}
                      className="h-4 w-4 accent-[#c8a96e]"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      defaultValue={u.note ?? ''}
                      onBlur={(e) => {
                        const note = e.target.value.trim() || null
                        if (note !== u.note) patch(u.id, { note })
                      }}
                      className="w-full min-w-40 rounded-md border border-transparent bg-transparent px-2 py-1 text-warm-gray/75 outline-none hover:border-line focus:border-gold/60"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-5 font-mono text-xs text-warm-gray/40">{inv.importHint}</p>
    </div>
  )
}
