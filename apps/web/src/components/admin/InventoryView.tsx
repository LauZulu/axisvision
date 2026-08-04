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

  const locationSelect = (u: ProductUnitDTO, extra = '') => (
    <select
      value={u.location}
      onChange={(e) => patch(u.id, { location: e.target.value })}
      aria-label={inv.location}
      className={`rounded-md border border-line bg-carbon-900 px-2 py-2 text-base text-warm-white outline-none focus:border-gold/60 lg:py-1.5 lg:text-sm ${extra}`}
    >
      {LOCATIONS.map((loc) => (
        <option key={loc} value={loc}>
          {locationLabel[loc]}
        </option>
      ))}
    </select>
  )

  const noteInput = (u: ProductUnitDTO, extra: string) => (
    <input
      defaultValue={u.note ?? ''}
      aria-label={inv.note}
      placeholder={inv.note}
      onBlur={(e) => {
        const note = e.target.value.trim() || null
        if (note !== u.note) patch(u.id, { note })
      }}
      className={`w-full rounded-md px-2 py-1 text-warm-gray/75 outline-none focus:border-gold/60 ${extra}`}
    />
  )

  return (
    <div>
      <h1 className="font-head text-xl text-warm-white sm:text-2xl">{inv.title}</h1>
      <p className="mt-1 text-sm text-warm-gray/60 sm:text-base">{inv.subtitle}</p>

      <div className="mt-5 flex flex-wrap items-center gap-3 sm:mt-6 sm:gap-4">
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          aria-label={inv.model}
          className="w-full rounded-md border border-line bg-carbon-900 px-3 py-2.5 text-base text-warm-white outline-none focus:border-gold/60 sm:w-auto sm:py-2 sm:text-sm"
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
        <>
        {/* Móvil/tableta: una ficha por unidad. Siete columnas no caben en un
            teléfono, y esta es la vista que se usa gafa en mano. */}
        <ul className="mt-5 space-y-3 lg:hidden">
          {visible.map((u) => (
            <li
              key={u.id}
              className={`rounded-2xl border border-line bg-carbon-850 p-4 transition-opacity ${
                savingId === u.id ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-warm-white">{u.code}</div>
                  <div className="truncate text-sm text-warm-gray/70">
                    {u.productName}
                    {u.modelCode && (
                      <span className="ml-2 font-mono text-[0.7rem] text-warm-gray/45">
                        {u.modelCode}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 font-mono text-xs text-warm-gray/45">
                    {inv.unit} {u.unitNumber} ·{' '}
                    {u.lensType === 'ophthalmic' ? inv.lensOphthalmic : inv.lensSun}
                  </div>
                </div>
                {locationSelect(u, 'shrink-0')}
              </div>

              <label className="mt-3 flex items-center gap-2.5 text-sm text-warm-gray/80">
                <input
                  type="checkbox"
                  checked={u.sellable}
                  onChange={(e) => patch(u.id, { sellable: e.target.checked })}
                  className="h-5 w-5 accent-[#c8a96e]"
                />
                {inv.sellable}
              </label>

              <div className="mt-3">{noteInput(u, 'border border-line bg-carbon-900 py-2 text-base')}</div>
            </li>
          ))}
        </ul>

        <div className="mt-6 hidden overflow-x-auto rounded-xl border border-line lg:block">
          <table className="w-full text-sm">
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
                  <td className="px-4 py-2.5">{locationSelect(u)}</td>
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={u.sellable}
                      onChange={(e) => patch(u.id, { sellable: e.target.checked })}
                      aria-label={inv.sellable}
                      className="h-4 w-4 accent-[#c8a96e]"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    {noteInput(u, 'min-w-40 border border-transparent bg-transparent text-sm hover:border-line')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      <p className="mt-5 font-mono text-xs text-warm-gray/40">{inv.importHint}</p>
    </div>
  )
}
