'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Icon } from '../ui/Icon'
import { useDict } from '../../i18n/useDict'
import { useScrollTo } from '../../lib/scrollContext'
import { fill } from '../../lib/format'
import { normalizePhone } from '../../lib/phone'
import { resolveProductSrc } from '../../lib/productImages'
import { formatCop, type ProductDTO } from '../../lib/products'
import { canBuy } from '../../lib/storeMode'
import { whatsappLink } from '../../config/brand'
import { isDone, useWaitlistSignup } from './useWaitlistSignup'

type FieldError = 'model' | 'name' | 'phone' | null

/**
 * `/reservas` — el embudo de la promoción: elegir modelo y dejar el contacto,
 * en una sola pantalla.
 *
 * Tres campos y ni uno más: **modelo + nombre + WhatsApp**. Ni lente, ni
 * fórmula, ni correo — eso es la conversación de WhatsApp, y cada campo extra
 * en un formulario al que se llega desde una historia cuesta gente. El correo
 * ni siquiera aparece: el endpoint lo acepta opcional, así que se manda vacío.
 *
 * El modelo se pregunta (en vez de pedir solo el teléfono) porque es lo que
 * convierte un número suelto en un contacto que ya se puede atender: sin él, la
 * conversación empieza en "hola, ¿qué te interesa?" horas después. Además
 * `axis_stock_alert.productId` es NOT NULL — una reserva sin modelo no existe.
 *
 * Pensado para el pulgar: rejilla de dos columnas en móvil, tocar la foto es
 * elegir, y al elegir baja solo hasta el formulario. La ficha de la tienda es
 * para quien compara; esto es para quien ya vio una foto y quiere unas.
 *
 * `?modelo=<slug>` preselecciona: así es UNA página y siete enlaces — el
 * genérico enseña la rejilla y el de cada historia aterriza en su modelo.
 */
export function ReservaPicker({
  products,
  initialSlug,
}: {
  products: ProductDTO[]
  initialSlug?: string
}) {
  const { t } = useDict()
  const r = t.reserve
  const scrollTo = useScrollTo()

  const [selected, setSelected] = useState<ProductDTO | null>(
    () => products.find((p) => p.slug === initialSlug) ?? null,
  )
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [field, setField] = useState<FieldError>(null)
  // Con la tienda cerrada son contactos de "avísame cuando abran"; con la
  // tienda abierta, de "avísame cuando vuelva a haber".
  const { status, setStatus, submit } = useWaitlistSignup(canBuy() ? 'sold_out' : 'preview')

  function clearError() {
    if (status === 'error') setStatus('idle')
    setField(null)
  }

  function choose(product: ProductDTO) {
    setSelected(product)
    clearError()
    // El siguiente paso está más abajo y en un móvil no se ve: llevarlo hasta
    // ahí es la diferencia entre "elegí" y "ya dejé mis datos".
    scrollTo('#reserva-datos')
  }

  function fail(which: Exclude<FieldError, null>) {
    setField(which)
    setStatus('error')
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (status === 'sending') return

    if (!selected) {
      fail('model')
      scrollTo('#reserva-modelos')
      return
    }
    if (name.trim().length < 2) return fail('name')
    if (!normalizePhone(phone)) return fail('phone')

    setField(null)
    // Sin correo a propósito: el endpoint lo acepta vacío.
    await submit({ productId: selected.id, name, phone, website })
  }

  if (products.length === 0) {
    return (
      <section className="py-24 md:py-32">
        <div className="container-axis max-w-xl text-center">
          <h1 className="font-head text-2xl text-warm-white md:text-3xl">{r.emptyTitle}</h1>
          <p className="mt-4 text-warm-gray/70">{r.emptyBody}</p>
        </div>
      </section>
    )
  }

  if (isDone(status)) {
    const model = selected?.name ?? ''
    return (
      <section className="py-16 md:py-28">
        <div className="container-axis max-w-xl">
          <div className="rounded-2xl border border-gold/40 bg-carbon-850 p-6 sm:p-8">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-gold/50 text-gold">
              <Icon name="check" size={22} />
            </span>
            <h1 className="mt-5 font-head text-2xl leading-tight font-medium text-warm-white md:text-3xl">
              {status === 'already' ? r.alreadyTitle : r.okTitle}
            </h1>
            <p className="mt-3 leading-relaxed text-warm-gray/80">
              {fill(status === 'already' ? r.alreadyBody : r.okBody, { model })}
            </p>

            {/* Quien acaba de dejar su número suele querer hablar YA. Abrirle el
                chat aquí convierte una espera en una conversación. */}
            <a
              href={whatsappLink('general', fill(r.whatsappMessage, { model }))}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-axis mt-7 flex w-full justify-center sm:inline-flex sm:w-auto"
            >
              <Icon name="whatsapp" size={18} />
              {r.whatsappNow}
            </a>
            <Link
              href="/tienda"
              className="mt-4 block text-center font-mono text-xs tracking-widest text-gold sm:text-left"
            >
              {r.seeStore}
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const inputCls =
    // `text-base` (16px) obligatorio: por debajo, Safari de iOS hace zoom al
    // enfocar el campo y descoloca la página entera. Esto se usa casi todo en
    // móvil, así que aquí duele el doble.
    'w-full rounded-md border border-line bg-carbon-900 px-3 py-3 text-base text-warm-white outline-none focus:border-gold/60'
  const errorMsg =
    field === 'model' ? r.errorModel : field === 'name' ? r.errorName : field === 'phone' ? r.errorPhone : r.error

  return (
    <section className="py-10 md:py-20">
      <div className="container-axis max-w-3xl">
        <span className="eyebrow text-gold">{r.eyebrow}</span>
        <h1 className="mt-3 font-head text-[1.75rem] leading-[1.15] font-medium text-warm-white sm:text-4xl">
          {r.title}
        </h1>
        <p className="mt-3 max-w-lg leading-relaxed text-warm-gray/75">{r.intro}</p>

        <h2 id="reserva-modelos" className="eyebrow mt-9 text-warm-gray/50 sm:mt-12">
          {r.step1}
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {products.map((product) => {
            const active = selected?.id === product.id
            const cover = resolveProductSrc(product.images[0] ?? { key: '', url: null })
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => choose(product)}
                aria-pressed={active}
                className={`overflow-hidden rounded-2xl border text-left transition-colors ${
                  active ? 'border-gold bg-carbon-850' : 'border-line bg-carbon-850/60 hover:border-gold/50'
                }`}
              >
                <div className="relative aspect-[4/3] bg-carbon-900">
                  <Image
                    src={cover}
                    alt={product.name}
                    fill
                    sizes="(min-width: 640px) 33vw, 50vw"
                    className="object-cover object-center"
                  />
                  {active && (
                    <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-gold text-carbon-900">
                      <Icon name="check" size={14} />
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-head text-sm text-warm-white sm:text-base">{product.name}</h3>
                  <p className="mt-0.5 font-mono text-[0.7rem] tracking-wider text-warm-gray/55">
                    {formatCop(product.priceCop)}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        <form
          id="reserva-datos"
          onSubmit={onSubmit}
          className="mt-8 rounded-2xl border border-line bg-carbon-850 p-4 sm:mt-10 sm:p-6"
        >
          <h2 className="eyebrow text-warm-gray/50">{r.step2}</h2>
          <p className="mt-2 font-head text-warm-white">
            {selected ? fill(r.chosen, { model: selected.name }) : r.chooseFirst}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4">
            <div>
              <label htmlFor="reserva-nombre" className="eyebrow text-gold">
                {r.nameLabel}
              </label>
              <input
                id="reserva-nombre"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  clearError()
                }}
                placeholder={r.namePlaceholder}
                className={`mt-2.5 ${inputCls}`}
              />
            </div>
            <div>
              <label htmlFor="reserva-whatsapp" className="eyebrow text-gold">
                {r.phoneLabel}
              </label>
              <input
                id="reserva-whatsapp"
                type="tel"
                required
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  clearError()
                }}
                placeholder={r.phonePlaceholder}
                className={`mt-2.5 ${inputCls}`}
              />
            </div>
          </div>

          {/* Trampa para bots: fuera de la vista y del foco, nunca la ve una persona. */}
          <input
            type="text"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="pointer-events-none absolute h-0 w-0 opacity-0"
          />

          <button
            type="submit"
            disabled={status === 'sending'}
            className="btn-axis mt-5 flex w-full justify-center disabled:opacity-60 sm:w-auto"
          >
            {status === 'sending' ? r.sending : r.submit}
            <Icon name="arrow" size={18} />
          </button>

          <p className="mt-3 text-xs leading-relaxed text-warm-gray/55">
            {status === 'error' ? <span className="text-gold">{errorMsg}</span> : r.privacy}
          </p>
        </form>

        {/* Salida para quien prefiere hablar antes que llenar nada. Va discreta:
            el formulario deja el contacto AUNQUE no manden el mensaje, y por
            WhatsApp se pierde a quien abre el chat y no llega a enviar. */}
        <a
          href={whatsappLink('general')}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 text-sm text-warm-gray/60 transition-colors hover:text-gold"
        >
          <Icon name="whatsapp" size={16} />
          {r.orWhatsapp}
        </a>
      </div>
    </section>
  )
}
