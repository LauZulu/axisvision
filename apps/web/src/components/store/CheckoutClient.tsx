'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Icon } from '../ui/Icon'
import { useDict } from '../../i18n/useDict'
import { formatCop, type ProductDTO } from '../../lib/products'
import { resolveProductSrc } from '../../lib/productImages'
import { useCart, markCartPendingOrder, lineId, type CartItem } from '../../lib/cart'
import {
  defaultLens,
  lensName,
  prescriptionAddon,
  priceWithLens,
  type LensOptionDTO,
} from '../../lib/lenses'

type PaymentParams = {
  checkoutUrl: string
  publicKey: string
  currency: string
  amountInCents: number
  reference: string
  signature: string
  expirationTime: string
  redirectUrl: string
}

type CheckoutLine = {
  productId: string
  slug: string
  name: string
  priceCop: number
  quantity: number
  image: { key: string; url: string | null }
  lens: { id: string; name: string; extraPriceCop: number } | null
  /** Complemento de fórmula elegido en la ficha. null = sin graduación. */
  prescription?: { id: string; name: string; extraPriceCop: number } | null
}

/**
 * UUID v4 para identificar el intento de compra.
 *
 * `crypto.randomUUID()` solo existe en contexto seguro: en https y en localhost
 * está, pero abriendo el dev por la IP de la red local (http://192.168.x.x) no,
 * y ahí reventaría el checkout entero. El respaldo produce un UUID válido con
 * `getRandomValues` o, en última instancia, con `Math.random` — que para
 * distinguir dos clics del mismo formulario sobra.
 */
function newAttemptId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    /* contexto no seguro: sigue al respaldo */
  }
  const bytes = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256)
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40 // versión 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variante RFC 4122
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

const inputCls =
  'w-full rounded-md border border-line bg-carbon-900 px-3 py-2.5 text-warm-white outline-none focus:border-gold/60'

/**
 * Checkout de invitado. Dos modos:
 *  - "Comprar ahora": ?item=<slug>&qty=<n> (carga el producto de la API)
 *  - Carrito: sin query params (usa localStorage)
 * El servidor recalcula precios desde la DB y responde los parámetros FIRMADOS
 * del Web Checkout; aquí solo se auto-envía el form GET a checkout.wompi.co.
 */
export function CheckoutClient({ lensOptions = [] }: { lensOptions?: LensOptionDTO[] }) {
  const { t, lang } = useDict()
  const c = t.checkout
  const params = useSearchParams()
  const cart = useCart()
  const formRef = useRef<HTMLFormElement>(null)

  const buyNowSlug = params.get('item')
  const buyNowQty = Math.max(1, Math.min(Number(params.get('qty')) || 1, 20))
  const buyNowLensId = params.get('lens')
  const buyNowRx = params.get('rx') === '1'

  // Fórmulas médicas por línea (clave = lineId).
  const [prescriptions, setPrescriptions] = useState<Record<string, string>>({})

  const [buyNowLine, setBuyNowLine] = useState<CheckoutLine | null>(null)
  const [loadingItem, setLoadingItem] = useState(Boolean(buyNowSlug))
  const [submitting, setSubmitting] = useState(false)
  /**
   * Cerrojo contra el doble clic. `submitting` es estado: entre el primer clic
   * y el re-render que deshabilita el botón hay una ventana en la que un
   * segundo clic ve todavía `submitting === false` y dispara otra compra. Un
   * ref se actualiza en el acto, sin esperar al render.
   */
  const sending = useRef(false)
  /**
   * Identidad de ESTE intento de compra. El servidor la usa como clave de
   * idempotencia: si el mismo formulario se envía dos veces (doble clic,
   * reintento de red, botón atrás), devuelve el pedido que ya creó en vez de
   * uno nuevo. Se genera una sola vez por montaje del checkout.
   */
  const attemptId = useRef<string>('')
  if (!attemptId.current) attemptId.current = newAttemptId()
  const [payment, setPayment] = useState<PaymentParams | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    region: '',
    notes: '',
  })
  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }))

  // Modo "Comprar ahora": cargar el producto por slug.
  useEffect(() => {
    if (!buyNowSlug) return
    let alive = true
    fetch(`/api/products/${encodeURIComponent(buyNowSlug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { product?: ProductDTO } | null) => {
        if (!alive) return
        const p = data?.product
        if (p) {
          const cover = p.images[0] ?? { key: '', url: null }
          const lens =
            lensOptions.find((o) => o.id === buyNowLensId) ?? defaultLens(lensOptions)
          // La fórmula la pide el cliente, o la impone un lente que solo existe
          // graduado. El sobrecosto real lo recalcula el servidor igual.
          const addon = prescriptionAddon(lensOptions)
          const rx = buyNowRx || lens?.requiresPrescription ? (addon ?? null) : null
          setBuyNowLine({
            productId: p.id,
            slug: p.slug,
            name: p.name,
            priceCop: priceWithLens(p.priceCop, lens, rx),
            quantity: Math.min(buyNowQty, Math.max(1, p.stock)),
            image: { key: cover.key, url: cover.url },
            lens: lens
              ? { id: lens.id, name: lensName(lens, lang), extraPriceCop: lens.extraPriceCop }
              : null,
            prescription: rx
              ? { id: rx.id, name: lensName(rx, lang), extraPriceCop: rx.extraPriceCop }
              : null,
          })
        }
        setLoadingItem(false)
      })
      .catch(() => alive && setLoadingItem(false))
    return () => {
      alive = false
    }
  }, [buyNowSlug, buyNowQty, buyNowLensId, buyNowRx, lensOptions, lang])

  const lines: CheckoutLine[] = useMemo(() => {
    if (buyNowSlug) return buyNowLine ? [buyNowLine] : []
    return cart.map((i: CartItem) => ({ ...i, prescription: i.prescription ?? null }))
  }, [buyNowSlug, buyNowLine, cart])

  const total = lines.reduce((sum, l) => sum + l.priceCop * l.quantity, 0)

  // Con los parámetros firmados listos → auto-submit del form GET a Wompi.
  useEffect(() => {
    if (payment && formRef.current) formRef.current.submit()
  }, [payment])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (lines.length === 0 || sending.current) return
    sending.current = true
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || undefined,
          },
          shipping: {
            address: form.address.trim(),
            city: form.city.trim(),
            region: form.region.trim(),
            notes: form.notes.trim() || undefined,
          },
          idempotencyKey: attemptId.current,
          items: lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            lensOptionId: l.lens?.id,
            withPrescription: Boolean(l.prescription),
            prescriptionNote: prescriptions[lineId(l)]?.trim() || undefined,
          })),
        }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        const code = data?.error?.code
        setError(
          code === 'INSUFFICIENT_STOCK'
            ? c.errorStock
            : code === 'PRODUCT_UNAVAILABLE'
              ? c.errorUnavailable
              : code === 'PRESCRIPTION_REQUIRED'
                ? c.errorPrescription
                : (data?.error?.message ?? c.errorGeneric),
        )
        sending.current = false
        setSubmitting(false)
        return
      }

      const pay: PaymentParams | null = data?.order?.payment ?? null
      if (!pay) {
        setError(c.errorPaymentSetup)
        sending.current = false
        setSubmitting(false)
        return
      }
      // El carrito NO se vacía aquí: solo se marca cuál salió a pagar. Vaciarlo
      // antes de que el pago se apruebe deja sin nada a quien reciba un rechazo,
      // y Wompi no permite reutilizar una referencia ya usada. Lo vacía la
      // página de resultado cuando el pago queda aprobado.
      if (!buyNowSlug) markCartPendingOrder(pay.reference)
      setPayment(pay)
    } catch {
      setError(c.errorGeneric)
      sending.current = false
      setSubmitting(false)
    }
  }

  if (!loadingItem && lines.length === 0) {
    return (
      <section className="py-28 md:py-36">
        <div className="container-axis text-center">
          <h1 className="font-head text-2xl text-warm-white">{c.emptyTitle}</h1>
          <p className="mt-3 text-warm-gray/60">{c.emptyBody}</p>
          <Link href="/tienda" className="btn-axis mt-8 inline-flex">
            {t.cart.emptyCta}
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 md:py-24">
      <div className="container-axis max-w-5xl">
        <h1 className="font-head text-2xl text-warm-white md:text-3xl">{c.title}</h1>
        <p className="mt-2 text-warm-gray/60">{c.subtitle}</p>

        {/* `grid-cols-1` explícito: la pista `auto` de móvil toma como mínimo el
            min-content de sus hijos, así que cualquier fila ancha (una miniatura
            junto a un nombre largo) estiraría la columna y desbordaría la página
            entera. `minmax(0,1fr)` la deja en el ancho de la pantalla. */}
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
          {/* Formulario invitado */}
          <form onSubmit={onSubmit} className="order-2 lg:order-1">
            <h2 className="eyebrow text-gold">{c.contactTitle}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-warm-gray/80 sm:col-span-2">
                <span className="mb-1.5 block">{c.name}</span>
                <input className={inputCls} required value={form.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" />
              </label>
              <label className="block text-sm text-warm-gray/80">
                <span className="mb-1.5 block">{c.email}</span>
                <input className={inputCls} type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" />
              </label>
              <label className="block text-sm text-warm-gray/80">
                <span className="mb-1.5 block">{c.phone}</span>
                <input className={inputCls} type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" />
              </label>
            </div>

            <h2 className="eyebrow mt-8 text-gold">{c.shippingTitle}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-warm-gray/80 sm:col-span-2">
                <span className="mb-1.5 block">{c.address}</span>
                <input className={inputCls} required value={form.address} onChange={(e) => set('address', e.target.value)} autoComplete="street-address" />
              </label>
              <label className="block text-sm text-warm-gray/80">
                <span className="mb-1.5 block">{c.city}</span>
                <input className={inputCls} required value={form.city} onChange={(e) => set('city', e.target.value)} autoComplete="address-level2" />
              </label>
              <label className="block text-sm text-warm-gray/80">
                <span className="mb-1.5 block">{c.region}</span>
                <input className={inputCls} required value={form.region} onChange={(e) => set('region', e.target.value)} autoComplete="address-level1" />
              </label>
              <label className="block text-sm text-warm-gray/80 sm:col-span-2">
                <span className="mb-1.5 block">{c.notes}</span>
                <textarea className={`${inputCls} min-h-20`} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
              </label>
            </div>

            {/* Fórmula médica: solo para las líneas que la pidieron en la ficha. */}
            {lines.some((l) => l.prescription) && (
              <>
                <h2 className="eyebrow mt-8 text-gold">{c.prescriptionTitle}</h2>
                <p className="mt-2 text-sm text-warm-gray/60">{c.prescriptionHelp}</p>
                <div className="mt-4 space-y-4">
                  {lines
                    .filter((l) => l.prescription)
                    .map((l) => {
                      const id = lineId(l)
                      return (
                        <label key={id} className="block text-sm text-warm-gray/80">
                          <span className="mb-1.5 block">
                            {l.name}
                            {l.lens && (
                              <span className="ml-2 font-mono text-[0.7rem] tracking-wide text-gold/75">
                                {l.lens.name}
                              </span>
                            )}
                          </span>
                          <textarea
                            className={`${inputCls} min-h-20`}
                            required
                            placeholder={c.prescriptionPlaceholder}
                            value={prescriptions[id] ?? ''}
                            onChange={(e) =>
                              setPrescriptions((p) => ({ ...p, [id]: e.target.value }))
                            }
                          />
                        </label>
                      )
                    })}
                </div>
              </>
            )}

            {error && <p className="mt-5 text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting || loadingItem || lines.length === 0}
              className="btn-axis mt-7 w-full disabled:opacity-60 sm:w-auto"
            >
              {submitting ? (payment ? c.redirecting : c.paying) : c.payNow}
              <Icon name="arrow" size={18} />
            </button>
            <p className="mt-3 text-xs text-warm-gray/45">{c.secureNote}</p>
          </form>

          {/* Resumen */}
          <aside className="order-1 h-fit rounded-2xl border border-line bg-carbon-850 p-6 lg:order-2">
            <h2 className="font-head text-lg text-warm-white">{c.summaryTitle}</h2>
            <ul className="mt-4 space-y-4">
              {lines.map((l) => (
                <li key={lineId(l)} className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-line bg-carbon-900">
                    <Image src={resolveProductSrc(l.image)} alt={l.name} fill sizes="56px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-warm-white">{l.name}</div>
                    {(l.lens || l.prescription) && (
                      <div className="truncate font-mono text-[0.7rem] tracking-wide text-gold/75">
                        {[l.lens?.name, l.prescription?.name].filter(Boolean).join(' · ')}
                      </div>
                    )}
                    <div className="font-mono text-xs text-warm-gray/50">× {l.quantity}</div>
                  </div>
                  <span className="text-sm text-warm-gray/80">{formatCop(l.priceCop * l.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
              <span className="text-sm text-warm-gray/60">{t.cart.total}</span>
              <span className="font-head text-xl text-warm-white">{formatCop(total)}</span>
            </div>
          </aside>
        </div>
      </div>

      {/* Form oculto: Web Checkout de Wompi (GET). Se auto-envía al tener la firma. */}
      {payment && (
        <form ref={formRef} action={payment.checkoutUrl} method="GET">
          <input type="hidden" name="public-key" value={payment.publicKey} />
          <input type="hidden" name="currency" value={payment.currency} />
          <input type="hidden" name="amount-in-cents" value={payment.amountInCents} />
          <input type="hidden" name="reference" value={payment.reference} />
          <input type="hidden" name="signature:integrity" value={payment.signature} />
          <input type="hidden" name="expiration-time" value={payment.expirationTime} />
          <input type="hidden" name="redirect-url" value={payment.redirectUrl} />
          <input type="hidden" name="customer-data:email" value={form.email.trim()} />
          <input type="hidden" name="customer-data:full-name" value={form.name.trim()} />
          {form.phone.trim() && (
            <input type="hidden" name="customer-data:phone-number" value={form.phone.trim()} />
          )}
        </form>
      )}
    </section>
  )
}
