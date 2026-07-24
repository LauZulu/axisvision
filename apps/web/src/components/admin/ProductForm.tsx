'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUploader } from './ImageUploader'
import { useDict } from '../../i18n/useDict'
import type { ProductDTO } from '../../lib/products'

type FormState = {
  slug: string
  name: string
  taglineEs: string
  taglineEn: string
  descriptionEs: string
  descriptionEn: string
  priceCop: string
  stock: string
  position: string
  active: boolean
  images: string[]
}

function initial(product?: ProductDTO): FormState {
  return {
    slug: product?.slug ?? '',
    name: product?.name ?? '',
    taglineEs: product?.taglineEs ?? '',
    taglineEn: product?.taglineEn ?? '',
    descriptionEs: product?.descriptionEs ?? '',
    descriptionEn: product?.descriptionEn ?? '',
    priceCop: product ? String(product.priceCop) : '',
    stock: product ? String(product.stock) : '0',
    position: product ? String(product.position ?? 0) : '0',
    active: product?.active ?? true,
    images: product?.images.map((i) => i.key) ?? [],
  }
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block text-sm text-warm-gray/80">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  )
}

const inputCls =
  'w-full rounded-md border border-line bg-carbon-900 px-3 py-2.5 text-warm-white outline-none focus:border-gold/60'

export function ProductForm({ product }: { product?: ProductDTO }) {
  const { t } = useDict()
  const f = t.admin.form
  const router = useRouter()
  const [form, setForm] = useState<FormState>(() => initial(product))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      taglineEs: form.taglineEs.trim(),
      taglineEn: form.taglineEn.trim(),
      descriptionEs: form.descriptionEs.trim(),
      descriptionEn: form.descriptionEn.trim(),
      priceCop: Number(form.priceCop),
      stock: Number(form.stock),
      position: Number(form.position),
      active: form.active,
      images: form.images,
    }

    const url = product ? `/api/admin/products/${product.id}` : '/api/admin/products'
    const method = product ? 'PATCH' : 'POST'
    try {
      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        router.push('/admin/productos')
        router.refresh()
        return
      }
      const data = await res.json().catch(() => null)
      setError(data?.error?.message ?? f.saveError)
    } catch {
      setError(f.netError)
    }
    setSaving(false)
  }

  return (
    <div>
      <h1 className="font-head text-2xl text-warm-white">{product ? f.editTitle : f.newTitle}</h1>
      {product ? (
        <p className="mt-1 font-mono text-xs text-warm-gray/45">{product.slug}</p>
      ) : (
        <p className="mt-1 text-warm-gray/60">{f.newSubtitle}</p>
      )}

      <form onSubmit={onSubmit} className="mt-8 max-w-3xl">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={f.slug}>
            <input
              className={inputCls}
              value={form.slug}
              onChange={(e) => set('slug', e.target.value)}
              placeholder="axis-onyx"
              required
            />
          </Field>
          <Field label={f.name}>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="AXIS Onyx"
              required
            />
          </Field>
          <Field label={f.taglineEs}>
            <input className={inputCls} value={form.taglineEs} onChange={(e) => set('taglineEs', e.target.value)} required />
          </Field>
          <Field label={f.taglineEn}>
            <input className={inputCls} value={form.taglineEn} onChange={(e) => set('taglineEn', e.target.value)} required />
          </Field>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label={f.descriptionEs}>
            <textarea
              className={`${inputCls} min-h-24`}
              value={form.descriptionEs}
              onChange={(e) => set('descriptionEs', e.target.value)}
              required
            />
          </Field>
          <Field label={f.descriptionEn}>
            <textarea
              className={`${inputCls} min-h-24`}
              value={form.descriptionEn}
              onChange={(e) => set('descriptionEn', e.target.value)}
              required
            />
          </Field>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <Field label={f.price}>
            <input
              className={inputCls}
              type="number"
              min={0}
              value={form.priceCop}
              onChange={(e) => set('priceCop', e.target.value)}
              required
            />
          </Field>
          <Field label={f.stock}>
            <input
              className={inputCls}
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => set('stock', e.target.value)}
              required
            />
          </Field>
          <Field label={f.position}>
            <input
              className={inputCls}
              type="number"
              min={0}
              value={form.position}
              onChange={(e) => set('position', e.target.value)}
            />
          </Field>
        </div>

        <label className="mt-5 flex items-center gap-2.5 text-sm text-warm-gray/80">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => set('active', e.target.checked)}
            className="h-4 w-4 accent-[#c8a96e]"
          />
          {f.visible}
        </label>

        {/* Fotos: se suben directo a S3 (presigned PUT) y se sirven por CloudFront. */}
        <div className="mt-7">
          <ImageUploader value={form.images} onChange={(imgs) => set('images', imgs)} />
        </div>

        {error && <p className="mt-5 text-sm text-red-400">{error}</p>}

        <div className="mt-8 flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-axis disabled:opacity-60">
            {saving ? f.saving : product ? f.save : f.create}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/productos')}
            className="text-sm text-warm-gray/60 transition-colors hover:text-gold"
          >
            {f.cancel}
          </button>
        </div>
      </form>
    </div>
  )
}
