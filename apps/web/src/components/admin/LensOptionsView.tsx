'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDict } from '../../i18n/useDict'
import { formatCop } from '../../lib/products'
import type { LensOptionDTO } from '../../lib/lenses'

const inputCls =
  'w-full rounded-md border border-line bg-carbon-900 px-3 py-2 text-sm text-warm-white outline-none focus:border-gold/60'

type Draft = {
  slug: string
  nameEs: string
  nameEn: string
  descriptionEs: string
  descriptionEn: string
  extraPriceCop: string
  requiresPrescription: boolean
  isDefault: boolean
  active: boolean
  position: string
  imageVariant: '' | 'sunglass' | 'ophthalmic' | 'yellow'
}

function toDraft(o?: LensOptionDTO): Draft {
  return {
    slug: o?.slug ?? '',
    nameEs: o?.nameEs ?? '',
    nameEn: o?.nameEn ?? '',
    descriptionEs: o?.descriptionEs ?? '',
    descriptionEn: o?.descriptionEn ?? '',
    extraPriceCop: String(o?.extraPriceCop ?? 0),
    requiresPrescription: o?.requiresPrescription ?? false,
    isDefault: o?.isDefault ?? false,
    active: o?.active ?? true,
    position: String(o?.position ?? 0),
    imageVariant: o?.imageVariant ?? '',
  }
}

/**
 * Catálogo de lentes que el cliente elige al comprar. El lente de fábrica
 * (`isDefault`) va sin costo; el resto suma su sobrecosto al precio del producto.
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
      extraPriceCop: Number(draft.extraPriceCop) || 0,
      position: Number(draft.position) || 0,
      imageVariant: draft.imageVariant || null,
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
    } catch {
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-head text-2xl text-warm-white">{l.title}</h1>
          <p className="mt-1 text-warm-gray/60">{l.subtitle}</p>
        </div>
        {editing === null && (
          <button type="button" onClick={() => startEdit()} className="btn-axis">
            {l.add}
          </button>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {/* Formulario (alta o edición) */}
      {draft && (
        <div className="mt-6 rounded-xl border border-gold/40 bg-carbon-850 p-5">
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
            <label className="block text-sm text-warm-gray/80">
              <span className="mb-1.5 block">{l.extraPrice}</span>
              <input className={inputCls} type="number" min={0} value={draft.extraPriceCop} onChange={(e) => set('extraPriceCop', e.target.value)} />
            </label>
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
              </select>
              <span className="mt-1 block text-xs text-warm-gray/45">{l.imageVariantHint}</span>
            </label>
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

          <div className="mt-5 flex items-center gap-3">
            <button type="button" onClick={save} disabled={saving} className="btn-axis disabled:opacity-60">
              {saving ? l.saving : l.save}
            </button>
            <button type="button" onClick={cancel} className="text-sm text-warm-gray/60 transition-colors hover:text-gold">
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
                    <span className="rounded-full bg-gold px-2 py-0.5 font-mono text-[0.6rem] tracking-wide text-ink">
                      {l.included}
                    </span>
                  )}
                  {!o.active && (
                    <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[0.6rem] tracking-wide text-warm-gray/60">
                      {t.admin.products.hidden}
                    </span>
                  )}
                  {o.requiresPrescription && (
                    <span className="font-mono text-[0.65rem] tracking-wide text-gold/70">Rx</span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-sm text-warm-gray/55">{o.descriptionEs}</p>
              </div>
              <span className="font-mono text-sm text-warm-gray/80">
                {o.extraPriceCop > 0 ? `+ ${formatCop(o.extraPriceCop)}` : l.included}
              </span>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => startEdit(o)} className="text-sm text-warm-gray/70 transition-colors hover:text-gold">
                  {t.admin.products.edit}
                </button>
                <button type="button" onClick={() => remove(o.id)} className="text-sm text-warm-gray/45 transition-colors hover:text-red-400">
                  {l.delete}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
