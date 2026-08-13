'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDict } from '../../i18n/useDict'
import { formatCop } from '../../lib/products'
import { lensTypes, type LensOptionDTO } from '../../lib/lenses'
import {
  DEFAULT_PRICING_RULES,
  estimateRxPrice,
  type RxPriceDTO,
} from '../../lib/lensPricing'
import { LENS_INDEXES, type LensIndex, type RxType } from '../../lib/prescription'

/**
 * Precios de lente GRADUADO, celda a celda.
 *
 * Cada celda es un renglón de la lista del laboratorio: este lente, en
 * monofocal o progresiva, en este índice, cuesta esto. Lo que se deja vacío no
 * es gratis ni es cero — es "todavía no lo sé", y ahí el motor estima el precio
 * con la fórmula genérica y la tienda lo dice ("precio estimado"). Por eso el
 * placeholder de cada celda vacía enseña justo lo que se estimaría: cargar el
 * renglón real es cambiar una estimación por un precio, y conviene ver de qué
 * número se viene.
 *
 * Vaciar una celda ya guardada BORRA la fila (no la pone en 0): volver a
 * estimar es lo que se quiere cuando alguien detecta que ese precio estaba mal.
 * Un 0 vendería el lente regalado.
 *
 * Se usa desde el teléfono, así que hasta `lg` es una lista de fichas por
 * lente y de ahí para arriba una tabla — mismo patrón que el resto del panel,
 * y ninguna tabla con scroll horizontal.
 */
export function RxPriceMatrix({
  options,
  prices,
}: {
  options: LensOptionDTO[]
  prices: RxPriceDTO[]
}) {
  const { t } = useDict()
  const a = t.admin.rxPrices
  const router = useRouter()
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const lenses = lensTypes(options).filter((o) => o.active)
  const byKey = new Map(prices.map((p) => [`${p.lensOptionId}|${p.rxType}|${p.lensIndex}`, p]))

  async function save(
    lens: LensOptionDTO,
    rxType: RxType,
    lensIndex: LensIndex,
    raw: string,
  ) {
    const key = `${lens.id}|${rxType}|${lensIndex}`
    const existing = byKey.get(key)
    const value = raw.trim()
    // Nada que hacer: la celda estaba vacía y sigue vacía.
    if (!value && !existing) return
    // Lo tecleado es lo mismo que ya había guardado.
    if (value && existing && Number(value) === existing.priceCop) return

    setSaving(key)
    setError(null)
    try {
      const res = await fetch('/api/admin/lenses/precios', {
        method: value ? 'POST' : 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(
          value
            ? {
                lensOptionId: lens.id,
                rxType,
                lensIndex,
                priceCop: Math.max(0, Math.round(Number(value) || 0)),
                // El antirreflejo del lente graduado hereda el del terminado
                // mientras nadie diga otra cosa: `null` sigue significando "ya
                // lo trae puesto", que es una propiedad del lente, no del
                // índice.
                arExtraPriceCop: existing
                  ? existing.arExtraPriceCop
                  : lens.arExtraPriceCop,
              }
            : { lensOptionId: lens.id, rxType, lensIndex },
        ),
      })
      if (!res.ok) throw new Error('request failed')
      router.refresh()
    } catch (err) {
      console.error('[admin/lentes] no se pudo guardar el precio graduado:', err)
      setError(a.error)
    } finally {
      setSaving(null)
    }
  }

  if (lenses.length === 0) return null

  return (
    <section className="mt-12">
      <h2 className="font-head text-xl text-warm-white">{a.title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-warm-gray/65">{a.help}</p>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <div className="mt-6 space-y-6">
        {lenses.map((lens) => (
          <article key={lens.id} className="rounded-xl border border-line p-4 sm:p-5">
            <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="font-head text-warm-white">{lens.nameEs}</h3>
              <span className="font-mono text-xs tracking-wide text-warm-gray/50">
                {a.plano}: {lens.extraPriceCop > 0 ? formatCop(lens.extraPriceCop) : a.included}
              </span>
            </header>

            {(['single', 'progressive'] as RxType[]).map((rxType) => (
              <div key={rxType} className="mt-4">
                <span className="eyebrow text-gold">
                  {rxType === 'single' ? a.single : a.progressive}
                </span>
                {/* Dos columnas en móvil, cinco desde `lg`: son cinco celdas
                    cortas y apilarlas en una sola columna dejaba la ficha de un
                    lente más alta que la pantalla. */}
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  {LENS_INDEXES.map((lensIndex) => {
                    const key = `${lens.id}|${rxType}|${lensIndex}`
                    const row = byKey.get(key)
                    const estimate = estimateRxPrice(
                      lens.priceOnQuote ? 0 : lens.extraPriceCop,
                      lensIndex,
                      rxType,
                      DEFAULT_PRICING_RULES,
                    )
                    return (
                      <label key={lensIndex} className="block">
                        <span className="mb-1 block font-mono text-[0.6rem] tracking-widest text-warm-gray/50">
                          {lensIndex}
                        </span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          step={1000}
                          disabled={saving === key}
                          defaultValue={row ? String(row.priceCop) : ''}
                          placeholder={String(estimate)}
                          onBlur={(e) => save(lens, rxType, lensIndex, e.target.value)}
                          className={`w-full rounded-md border bg-carbon-900 px-2.5 py-2.5 text-base text-warm-white outline-none disabled:opacity-50 sm:py-2 sm:text-sm ${
                            row ? 'border-gold/40' : 'border-line'
                          } focus:border-gold/60`}
                        />
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </article>
        ))}
      </div>
    </section>
  )
}
