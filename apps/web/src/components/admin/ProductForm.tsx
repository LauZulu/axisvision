'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { fill } from '../../lib/format'
import { ImageUploader, type UploaderImage } from './ImageUploader'
import { LensGalleryPreview } from './LensGalleryPreview'
import { useDict } from '../../i18n/useDict'
import {
  lensName,
  lensTypes,
  optionsForProduct,
  type LensOptionDTO,
} from '../../lib/lenses'
import type { ProductDTO } from '../../lib/products'

type FormState = {
  slug: string
  name: string
  modelCode: string
  size: '' | 'chico' | 'mediano' | 'grande'
  taglineEs: string
  taglineEn: string
  descriptionEs: string
  descriptionEn: string
  priceCop: string
  compareAtPriceCop: string
  stock: string
  position: string
  active: boolean
  images: UploaderImage[]
  /** Lentes que ofrece el modelo. VACÍO = los ofrece todos (lo normal). */
  lensOptionIds: string[]
}

function initial(product?: ProductDTO): FormState {
  return {
    slug: product?.slug ?? '',
    name: product?.name ?? '',
    modelCode: product?.modelCode ?? '',
    size: product?.size ?? '',
    taglineEs: product?.taglineEs ?? '',
    taglineEn: product?.taglineEn ?? '',
    descriptionEs: product?.descriptionEs ?? '',
    descriptionEn: product?.descriptionEn ?? '',
    priceCop: product ? String(product.priceCop) : '',
    compareAtPriceCop: product?.compareAtPriceCop ? String(product.compareAtPriceCop) : '',
    stock: product ? String(product.stock) : '0',
    position: product ? String(product.position ?? 0) : '0',
    active: product?.active ?? true,
    images: product?.images.map((i) => ({ key: i.key, lensVariant: i.lensVariant })) ?? [],
    lensOptionIds: product?.lensOptionIds ?? [],
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

// `text-base` (16px) explícito: heredando el `text-sm` del label, Safari de iOS
// hace zoom al enfocar cada campo y editar desde el móvil se vuelve un baile.
const inputCls =
  'w-full rounded-md border border-line bg-carbon-900 px-3 py-2.5 text-base text-warm-white outline-none focus:border-gold/60'

export function ProductForm({
  product,
  lensOptions = [],
}: {
  product?: ProductDTO
  /** Opciones de lente activas: sirven para previsualizar la galería por lente. */
  lensOptions?: LensOptionDTO[]
}) {
  const { t, lang } = useDict()
  const f = t.admin.form
  const router = useRouter()
  const [form, setForm] = useState<FormState>(() => initial(product))
  // Stock derivado: hay unidades físicas cargadas para este producto.
  const derivedStock = (product?.unitsTotal ?? 0) > 0
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  // Opciones que el modelo ofrece de verdad (lista vacía = todas). Alimenta la
  // previsualización de la galería: si Apex solo ofrece un lente, no tiene
  // sentido enseñar qué se vería con transitions.
  const offered = optionsForProduct(lensOptions, form.lensOptionIds)

  /**
   * Marcar/desmarcar un lente. Desmarcar desde "todos" (lista vacía) parte de
   * TODAS las opciones menos esa: si no, el primer clic dejaría el modelo con
   * un único lente sin que nadie lo pidiera. Quedarse sin ningún lente vuelve a
   * significar "los ofrece todos", que es el estado seguro.
   */
  function toggleLens(id: string, checked: boolean) {
    setForm((f) => {
      const base = f.lensOptionIds.length === 0 ? lensOptions.map((o) => o.id) : f.lensOptionIds
      const next = checked ? [...new Set([...base, id])] : base.filter((x) => x !== id)
      const quedanLentes = lensTypes(lensOptions.filter((o) => next.includes(o.id))).length > 0
      return { ...f, lensOptionIds: quedanLentes ? next : [] }
    })
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      modelCode: form.modelCode.trim() || null,
      size: form.size || null,
      taglineEs: form.taglineEs.trim(),
      taglineEn: form.taglineEn.trim(),
      descriptionEs: form.descriptionEs.trim(),
      descriptionEn: form.descriptionEn.trim(),
      priceCop: Number(form.priceCop),
      compareAtPriceCop: form.compareAtPriceCop.trim() === '' ? null : Number(form.compareAtPriceCop),
      // Con inventario por unidad el stock lo deriva el servidor: no se envía.
      ...(derivedStock ? {} : { stock: Number(form.stock) }),
      position: Number(form.position),
      active: form.active,
      images: form.images,
      lensOptionIds: form.lensOptionIds,
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
    } catch (err) {
      // Aquí solo caen los fallos de RED (los HTTP se tratan arriba). El aviso
      // en pantalla es genérico a propósito, así que sin esta línea la consola
      // del navegador —el único sitio donde se puede mirar— queda muda.
      console.error('[admin] no se pudo guardar el producto:', err)
      setError(f.netError)
    }
    setSaving(false)
  }

  return (
    <div>
      <h1 className="font-head text-xl text-warm-white sm:text-2xl">
        {product ? f.editTitle : f.newTitle}
      </h1>
      {product ? (
        <p className="mt-1 break-all font-mono text-xs text-warm-gray/45">{product.slug}</p>
      ) : (
        <p className="mt-1 text-sm text-warm-gray/60 sm:text-base">{f.newSubtitle}</p>
      )}

      <form onSubmit={onSubmit} className="mt-6 max-w-3xl sm:mt-8">
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
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
              placeholder="AXIS Origin"
              required
            />
          </Field>
          <Field label={f.modelCode}>
            <input
              className={inputCls}
              value={form.modelCode}
              onChange={(e) => set('modelCode', e.target.value)}
              placeholder="M02"
            />
            <span className="mt-1 block text-xs text-warm-gray/45">{f.modelCodeHint}</span>
          </Field>
          <Field label={f.size}>
            <select
              className={inputCls}
              value={form.size}
              onChange={(e) => set('size', e.target.value as FormState['size'])}
            >
              <option value="">—</option>
              <option value="chico">{f.sizeSmall}</option>
              <option value="mediano">{f.sizeMedium}</option>
              <option value="grande">{f.sizeLarge}</option>
            </select>
          </Field>
          <Field label={f.taglineEs}>
            <input className={inputCls} value={form.taglineEs} onChange={(e) => set('taglineEs', e.target.value)} required />
          </Field>
          <Field label={f.taglineEn}>
            <input className={inputCls} value={form.taglineEn} onChange={(e) => set('taglineEn', e.target.value)} required />
          </Field>
        </div>

        <div className="mt-4 grid gap-4 sm:mt-5 sm:grid-cols-2 sm:gap-5">
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

        {/* Una columna en móvil: estas etiquetas son largas ("Precio anterior
            (opcional, muestra descuento)") y a dos columnas ocupan tres líneas. */}
        <div className="mt-4 grid gap-4 sm:mt-5 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
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
          <Field label={f.compareAtPrice}>
            <input
              className={inputCls}
              type="number"
              min={0}
              value={form.compareAtPriceCop}
              onChange={(e) => set('compareAtPriceCop', e.target.value)}
              placeholder="—"
            />
          </Field>
          <Field label={f.stock}>
            <input
              className={`${inputCls} ${derivedStock ? 'cursor-not-allowed opacity-60' : ''}`}
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => set('stock', e.target.value)}
              readOnly={derivedStock}
              required={!derivedStock}
            />
            {derivedStock && (
              <span className="mt-1 block text-xs text-warm-gray/45">
                {fill(f.stockDerived, { total: product?.unitsTotal ?? 0 })}{' '}
                <Link href={`/admin/inventario?producto=${product?.slug}`} className="text-gold hover:underline">
                  {f.stockManage}
                </Link>
              </span>
            )}
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

        {/* Lentes que ofrece este modelo. Ninguno marcado = los ofrece todos:
            es el caso de casi todo el catálogo, y el default seguro (un modelo
            nuevo sin marcar sale con todos, no sin ninguno). */}
        {lensOptions.length > 0 && (
          <fieldset className="mt-7 rounded-lg border border-line p-3 sm:p-4">
            <legend className="px-1 text-sm text-warm-gray/80">{f.lensOffered}</legend>
            <p className="mb-3 text-xs text-warm-gray/45">
              {form.lensOptionIds.length === 0 ? f.lensOfferedAll : f.lensOfferedSome}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {lensOptions.map((option) => {
                const checked = form.lensOptionIds.includes(option.id)
                const esFormula = option.kind === 'prescription'
                return (
                  <label
                    key={option.id}
                    className="flex items-start gap-2.5 rounded-md border border-line px-3 py-2.5 text-sm text-warm-gray/80"
                  >
                    <input
                      type="checkbox"
                      checked={checked || form.lensOptionIds.length === 0}
                      onChange={(e) => toggleLens(option.id, e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[#c8a96e]"
                    />
                    <span>
                      {lensName(option, lang)}
                      {esFormula && (
                        <span className="ml-1.5 font-mono text-[0.6rem] uppercase tracking-wide text-gold/70">
                          {f.lensOfferedRx}
                        </span>
                      )}
                    </span>
                  </label>
                )
              })}
            </div>
            {form.lensOptionIds.length > 0 && (
              <button
                type="button"
                onClick={() => set('lensOptionIds', [])}
                className="mt-3 text-xs text-gold hover:underline"
              >
                {f.lensOfferedReset}
              </button>
            )}
          </fieldset>
        )}

        {/* Fotos: se suben directo a S3 (presigned PUT) y se sirven por CloudFront.
            Debajo, qué galería verá el cliente con cada tipo de lente. */}
        <div className="mt-7">
          <ImageUploader
            value={form.images}
            onChange={(imgs) => set('images', imgs)}
            slug={form.slug.trim() || product?.slug}
          />
          <LensGalleryPreview images={form.images} options={offered} />
        </div>

        {error && <p className="mt-5 text-sm text-red-400">{error}</p>}

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={saving}
            className="btn-axis w-full disabled:opacity-60 sm:w-auto"
          >
            {saving ? f.saving : product ? f.save : f.create}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/productos')}
            className="w-full py-2 text-sm text-warm-gray/60 transition-colors hover:text-gold sm:w-auto"
          >
            {f.cancel}
          </button>
        </div>
      </form>
    </div>
  )
}
