'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDict } from '../../i18n/useDict'
import { formatCop, type ImageLensVariant } from '../../lib/products'
import { lensPriceLabel, type LensOptionDTO } from '../../lib/lenses'

// `text-base` en móvil (16px) para que Safari de iOS no haga zoom al enfocar;
// a partir de `sm` vuelve al cuerpo compacto de la tabla.
const inputCls =
  'w-full rounded-md border border-line bg-carbon-900 px-3 py-2.5 text-base text-warm-white outline-none focus:border-gold/60 sm:py-2 sm:text-sm'

type Draft = {
  slug: string
  kind: 'lens' | 'prescription' | 'coating'
  nameEs: string
  nameEn: string
  descriptionEs: string
  descriptionEn: string
  extraPriceCop: string
  priceOnQuote: boolean
  /** Vacío = este lente ya trae el antirreflejo puesto (se guarda como null). */
  arExtraPriceCop: string
  requiresPrescription: boolean
  isDefault: boolean
  active: boolean
  position: string
  imageVariant: '' | ImageLensVariant
  /** Hex del color simulado. Vacío = esta opción no se tiñe. */
  tintColor: string
}

function toDraft(o?: LensOptionDTO): Draft {
  return {
    slug: o?.slug ?? '',
    kind: o?.kind ?? 'lens',
    nameEs: o?.nameEs ?? '',
    nameEn: o?.nameEn ?? '',
    descriptionEs: o?.descriptionEs ?? '',
    descriptionEn: o?.descriptionEn ?? '',
    extraPriceCop: String(o?.extraPriceCop ?? 0),
    priceOnQuote: o?.priceOnQuote ?? false,
    arExtraPriceCop: o?.arExtraPriceCop === null || o?.arExtraPriceCop === undefined
      ? ''
      : String(o.arExtraPriceCop),
    requiresPrescription: o?.requiresPrescription ?? false,
    isDefault: o?.isDefault ?? false,
    active: o?.active ?? true,
    position: String(o?.position ?? 0),
    imageVariant: o?.imageVariant ?? '',
    tintColor: o?.tintColor ?? '',
  }
}

/**
 * Catálogo del configurador de lente. Son dos cosas distintas conviviendo en la
 * misma tabla, y el campo `kind` es el que las separa: los `lens` son los tipos
 * de lente (el cliente elige UNO, y el `isDefault` va sin costo) y el
 * `prescription` es el complemento de fórmula, que se suma a cualquiera de ellos.
 */
export function LensOptionsView({ options }: { options: LensOptionDTO[] }) {
  const { t } = useDict()
  const l = t.admin.lenses
  const router = useRouter()
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d))

  function startEdit(option?: LensOptionDTO) {
    setEditing(option?.id ?? 'new')
    setDraft(toDraft(option))
    setError(null)
  }

  function cancel() {
    setEditing(null)
    setDraft(null)
    setError(null)
  }

  async function save() {
    if (!draft) return
    setSaving(true)
    setError(null)
    const payload = {
      ...draft,
      // Por confirmar = no se cobra nada al pagar. Se guarda en 0 para que el
      // número que quedó en el input no reviva si alguien desmarca la casilla.
      extraPriceCop: draft.priceOnQuote ? 0 : Number(draft.extraPriceCop) || 0,
      // Vacío = null = "este lente ya lo trae". Solo aplica a los tipos de
      // lente: en los complementos la columna no significa nada.
      arExtraPriceCop:
        draft.kind === 'lens' && draft.arExtraPriceCop.trim() !== ''
          ? Number(draft.arExtraPriceCop) || 0
          : null,
      position: Number(draft.position) || 0,
      imageVariant: draft.imageVariant || null,
      // Vacío = no se simula. Lo llevan así el transparente (que ES la foto
      // base), el antirreflejo y la fórmula: ninguno cambia el color del lente.
      tintColor: draft.tintColor.trim() || null,
    }
    const isNew = editing === 'new'
    try {
      const res = await fetch(isNew ? '/api/admin/lenses' : `/api/admin/lenses/${editing}`, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error?.message ?? l.saveError)
        setSaving(false)
        return
      }
      cancel()
      router.refresh()
    } catch (err) {
      console.error('[admin] no se pudo guardar la opción de lente:', err)
      setError(l.saveError)
    }
    setSaving(false)
  }

  async function remove(id: string) {
    if (!window.confirm(l.deleteConfirm)) return
    const res = await fetch(`/api/admin/lenses/${id}`, { method: 'DELETE' })
    if (res.ok) router.refresh()
    else setError(l.saveError)
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-head text-xl text-warm-white sm:text-2xl">{l.title}</h1>
          <p className="mt-1 text-sm text-warm-gray/60 sm:text-base">{l.subtitle}</p>
        </div>
        {editing === null && (
          <button
            type="button"
            onClick={() => startEdit()}
            className="btn-axis w-full shrink-0 sm:w-auto"
          >
            {l.add}
          </button>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {/* Formulario (alta o edición) */}
      {draft && (
        <div className="mt-6 rounded-xl border border-gold/40 bg-carbon-850 p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-warm-gray/80">
              <span className="mb-1.5 block">{l.name}</span>
              <input className={inputCls} value={draft.nameEs} onChange={(e) => set('nameEs', e.target.value)} />
            </label>
            <label className="block text-sm text-warm-gray/80">
              <span className="mb-1.5 block">{l.nameEn}</span>
              <input className={inputCls} value={draft.nameEn} onChange={(e) => set('nameEn', e.target.value)} />
            </label>
            <label className="block text-sm text-warm-gray/80">
              <span className="mb-1.5 block">{l.descriptionEs}</span>
              <textarea className={`${inputCls} min-h-16`} value={draft.descriptionEs} onChange={(e) => set('descriptionEs', e.target.value)} />
            </label>
            <label className="block text-sm text-warm-gray/80">
              <span className="mb-1.5 block">{l.descriptionEn}</span>
              <textarea className={`${inputCls} min-h-16`} value={draft.descriptionEn} onChange={(e) => set('descriptionEn', e.target.value)} />
            </label>
            {/* Precio y "por confirmar" son la misma decisión, así que van
                juntos — pero en dos <label> hermanos: anidarlos haría que un
                clic en la casilla enfocara también el campo de precio. */}
            <div className="text-sm text-warm-gray/80">
              <label className="block">
                <span className="mb-1.5 block">{l.extraPrice}</span>
                {/* Con "por confirmar" el precio no existe: se deshabilita el
                    campo en vez de dejar un número que no se va a cobrar. */}
                <input
                  className={`${inputCls} disabled:opacity-45`}
                  type="number"
                  min={0}
                  disabled={draft.priceOnQuote}
                  value={draft.priceOnQuote ? '' : draft.extraPriceCop}
                  placeholder={draft.priceOnQuote ? l.onQuote : undefined}
                  onChange={(e) => set('extraPriceCop', e.target.value)}
                />
              </label>
              <label className="mt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.priceOnQuote}
                  onChange={(e) => set('priceOnQuote', e.target.checked)}
                  className="h-4 w-4 accent-[#c8a96e]"
                />
                {l.priceOnQuote}
              </label>
              <span className="mt-1 block text-xs text-warm-gray/45">{l.priceOnQuoteHint}</span>
            </div>

            {/* El antirreflejo es un complemento, pero su precio vive en cada
                LENTE: no cuesta lo mismo sobre un transparente que sobre un
                fotocromático, y hay lentes que ya lo traen. */}
            {draft.kind === 'lens' && (
              <label className="block text-sm text-warm-gray/80">
                <span className="mb-1.5 block">{l.arExtraPrice}</span>
                <input
                  className={inputCls}
                  type="number"
                  min={0}
                  value={draft.arExtraPriceCop}
                  placeholder={l.arIncluded}
                  onChange={(e) => set('arExtraPriceCop', e.target.value)}
                />
                <span className="mt-1 block text-xs text-warm-gray/45">{l.arExtraPriceHint}</span>
              </label>
            )}
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm text-warm-gray/80">
                <span className="mb-1.5 block">{l.slug}</span>
                <input className={inputCls} value={draft.slug} onChange={(e) => set('slug', e.target.value)} placeholder="transitions" />
              </label>
              <label className="block text-sm text-warm-gray/80">
                <span className="mb-1.5 block">{l.position}</span>
                <input className={inputCls} type="number" min={0} value={draft.position} onChange={(e) => set('position', e.target.value)} />
              </label>
            </div>
            <label className="block text-sm text-warm-gray/80">
              <span className="mb-1.5 block">{l.kind}</span>
              <select
                className={inputCls}
                value={draft.kind}
                onChange={(e) => set('kind', e.target.value as Draft['kind'])}
              >
                <option value="lens">{l.kindLens}</option>
                <option value="coating">{l.kindCoating}</option>
                <option value="prescription">{l.kindPrescription}</option>
              </select>
              <span className="mt-1 block text-xs text-warm-gray/45">{l.kindHint}</span>
            </label>
            <label className="block text-sm text-warm-gray/80">
              <span className="mb-1.5 block">{l.imageVariant}</span>
              <select
                className={inputCls}
                value={draft.imageVariant}
                onChange={(e) => set('imageVariant', e.target.value as Draft['imageVariant'])}
              >
                <option value="">{l.variantNone}</option>
                <option value="sunglass">{l.variantSun}</option>
                <option value="ophthalmic">{l.variantOphthalmic}</option>
                <option value="yellow">{l.variantYellow}</option>
                <option value="transitions">{l.variantTransitions}</option>
                <option value="blue">{l.variantBlue}</option>
              </select>
              <span className="mt-1 block text-xs text-warm-gray/45">{l.imageVariantHint}</span>
            </label>
            {/* Solo en los tipos de lente: el antirreflejo y la fórmula no
                cambian el color de nada. El campo de texto va al lado del
                selector de color para poder pegar un hex del catálogo. */}
            {draft.kind === 'lens' && (
              <label className="block text-sm text-warm-gray/80">
                <span className="mb-1.5 block">{l.tintColor}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label={l.tintColor}
                    value={/^#[0-9a-fA-F]{6}$/.test(draft.tintColor) ? draft.tintColor : '#808080'}
                    onChange={(e) => set('tintColor', e.target.value)}
                    className="h-10 w-12 shrink-0 cursor-pointer rounded border border-line bg-transparent"
                  />
                  <input
                    className={inputCls}
                    value={draft.tintColor}
                    placeholder="#3b3833"
                    onChange={(e) => set('tintColor', e.target.value)}
                  />
                </div>
                <span className="mt-1 block text-xs text-warm-gray/45">{l.tintColorHint}</span>
              </label>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2.5 text-sm text-warm-gray/80">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={draft.active} onChange={(e) => set('active', e.target.checked)} className="h-4 w-4 accent-[#c8a96e]" />
              {l.active}
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={draft.requiresPrescription} onChange={(e) => set('requiresPrescription', e.target.checked)} className="h-4 w-4 accent-[#c8a96e]" />
              {l.requiresPrescription}
            </label>
            <label className="flex items-center gap-2" title={l.defaultHint}>
              <input type="checkbox" checked={draft.isDefault} onChange={(e) => set('isDefault', e.target.checked)} className="h-4 w-4 accent-[#c8a96e]" />
              {l.isDefault}
            </label>
          </div>

          <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="btn-axis w-full disabled:opacity-60 sm:w-auto"
            >
              {saving ? l.saving : l.save}
            </button>
            <button
              type="button"
              onClick={cancel}
              className="w-full py-2 text-sm text-warm-gray/60 transition-colors hover:text-gold sm:w-auto"
            >
              {l.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {options.length === 0 && !draft ? (
        <p className="mt-10 text-warm-gray/60">{l.empty}</p>
      ) : (
        <ul className="mt-6 divide-y divide-line/60 rounded-xl border border-line">
          {options.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-head text-warm-white">{o.nameEs}</span>
                  {o.isDefault && (
                    <span className="rounded-full bg-gold px-2 py-0.5 font-mono text-[0.6rem] tracking-wide text-carbon-900">
                      {l.included}
                    </span>
                  )}
                  {!o.active && (
                    <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[0.6rem] tracking-wide text-warm-gray/60">
                      {t.admin.products.hidden}
                    </span>
                  )}
                  {(o.kind === 'prescription' || o.kind === 'coating' || o.requiresPrescription) && (
                    <span className="font-mono text-[0.65rem] tracking-wide text-gold/70">
                      {o.kind === 'prescription'
                        ? l.kindPrescription
                        : o.kind === 'coating'
                          ? l.kindCoating
                          : 'Rx'}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 line-clamp-2 text-sm text-warm-gray/55 sm:truncate">
                  {o.descriptionEs}
                </p>
              </div>
              {/* En móvil el precio y las acciones bajan a su propia línea y se
                  reparten el ancho: en la misma fila que el nombre quedaban
                  dos enlaces de 12px pegados al borde. */}
              <div className="flex w-full items-center justify-between gap-4 sm:w-auto">
                <span className="font-mono text-sm text-warm-gray/80">
                  {lensPriceLabel(o, l)}
                  {o.kind === 'lens' && (
                    <span className="ml-2 text-xs text-warm-gray/45">
                      {o.arExtraPriceCop === null
                        ? l.arIncludedShort
                        : `AR + ${formatCop(o.arExtraPriceCop)}`}
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(o)}
                    className="rounded-md px-2 py-1.5 text-sm text-warm-gray/70 transition-colors hover:text-gold"
                  >
                    {t.admin.products.edit}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(o.id)}
                    className="rounded-md px-2 py-1.5 text-sm text-warm-gray/45 transition-colors hover:text-red-400"
                  >
                    {l.delete}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
