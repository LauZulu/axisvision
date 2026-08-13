'use client'

import { useState, type FormEvent } from 'react'
import { Icon } from '../ui/Icon'
import { useDict } from '../../i18n/useDict'
import { fill } from '../../lib/format'
import { normalizePhone } from '../../lib/phone'
import { whatsappLink } from '../../config/brand'

type FieldError = 'name' | 'phone' | null
type Status = 'idle' | 'sending' | 'done' | 'error'

/**
 * "Quiero que me tomen la fórmula."
 *
 * Es la salida del primer paso del configurador para quien no tiene su
 * graduación a la mano — la mayoría de la gente que no acaba de salir del
 * optómetra. Sin ella, ese cliente se quedaba mirando diez casillas que no
 * podía llenar.
 *
 * Pide lo mínimo: nombre y WhatsApp. Ciudad y horario son opcionales porque
 * ahorran un mensaje de ida y vuelta, no porque hagan falta para agendar; cada
 * campo obligatorio de más cuesta gente, y aquí la conversión es que alguien
 * conteste el WhatsApp.
 *
 * El teléfono se valida con `normalizePhone()`, la MISMA función con la que el
 * servidor lo guarda: si aquí pasa, allá entra. Y el `website` oculto es la
 * trampa para bots del resto de formularios públicos.
 */
export function AppointmentForm({
  productId,
  lensOptionId,
  productName,
  onDone,
}: {
  productId: string | null
  lensOptionId: string | null
  productName?: string
  /** Se llama al cerrar la pantalla de confirmación. */
  onDone?: () => void
}) {
  const { t, lang } = useDict()
  const a = t.store.appointment
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [note, setNote] = useState('')
  const [website, setWebsite] = useState('')
  const [field, setField] = useState<FieldError>(null)
  const [status, setStatus] = useState<Status>('idle')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (status === 'sending') return
    if (name.trim().length < 2) return fail('name')
    if (!normalizePhone(phone)) return fail('phone')

    setField(null)
    setStatus('sending')
    try {
      const res = await fetch('/api/citas', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          productId: productId ?? undefined,
          lensOptionId: lensOptionId ?? undefined,
          name: name.trim(),
          phone: phone.trim(),
          city: city.trim() || undefined,
          preferredTime: preferredTime.trim() || undefined,
          note: note.trim() || undefined,
          locale: lang,
          website,
        }),
      })
      if (!res.ok) throw new Error('request failed')
      setStatus('done')
    } catch (err) {
      // Si esto falla, la persona no tiene otra forma de llegar a nosotros
      // desde aquí: por eso la pantalla de error deja igualmente el WhatsApp.
      console.error('[citas] no se pudo pedir la cita:', err)
      setStatus('error')
    }
  }

  function fail(which: Exclude<FieldError, null>) {
    setField(which)
    setStatus('error')
  }

  function edit(set: (v: string) => void) {
    return (value: string) => {
      set(value)
      if (status === 'error') {
        setStatus('idle')
        setField(null)
      }
    }
  }

  if (status === 'done') {
    return (
      <div>
        <p className="flex items-center gap-2 font-head text-xl text-warm-white">
          <Icon name="check" size={20} className="shrink-0 text-gold" />
          {a.doneTitle}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-warm-gray/75">{a.doneBody}</p>
        <a
          href={whatsappLink('general', fill(a.whatsappMessage, { model: productName ?? '' }))}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-axis mt-6 inline-flex w-full justify-center"
        >
          {a.whatsappCta}
          <Icon name="arrow" size={18} />
        </a>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="mt-3 w-full text-sm text-warm-gray/60 underline underline-offset-4 transition-colors hover:text-gold"
          >
            {a.backToStore}
          </button>
        )}
      </div>
    )
  }

  // `text-base` (16px): por debajo, Safari de iOS hace zoom al enfocar y
  // descoloca el panel. Misma regla que en el admin y en /reservas.
  const inputCls =
    'w-full rounded-md border border-line bg-carbon-900 px-3 py-2.5 text-base text-warm-white outline-none focus:border-gold/60'

  return (
    <form onSubmit={onSubmit}>
      <h3 className="text-center font-head text-2xl font-medium text-warm-white">{a.title}</h3>
      <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-relaxed text-warm-gray/65">
        {a.body}
      </p>

      <div className="mt-6 space-y-4">
        <label className="block text-sm text-warm-gray/80">
          <span className="mb-1.5 block">{a.name}</span>
          <input
            className={`${inputCls} ${field === 'name' ? 'border-red-400/70' : ''}`}
            required
            autoComplete="name"
            value={name}
            onChange={(e) => edit(setName)(e.target.value)}
          />
        </label>
        <label className="block text-sm text-warm-gray/80">
          <span className="mb-1.5 block">{a.phone}</span>
          <input
            className={`${inputCls} ${field === 'phone' ? 'border-red-400/70' : ''}`}
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="312 372 7253"
            value={phone}
            onChange={(e) => edit(setPhone)(e.target.value)}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-warm-gray/80">
            <span className="mb-1.5 block">{a.city}</span>
            <input
              className={inputCls}
              autoComplete="address-level2"
              value={city}
              onChange={(e) => edit(setCity)(e.target.value)}
            />
          </label>
          <label className="block text-sm text-warm-gray/80">
            <span className="mb-1.5 block">{a.time}</span>
            <input
              className={inputCls}
              placeholder={a.timePlaceholder}
              value={preferredTime}
              onChange={(e) => edit(setPreferredTime)(e.target.value)}
            />
          </label>
        </div>
        <label className="block text-sm text-warm-gray/80">
          <span className="mb-1.5 block">{a.note}</span>
          <textarea
            className={`${inputCls} min-h-20`}
            value={note}
            onChange={(e) => edit(setNote)(e.target.value)}
          />
        </label>
      </div>

      {/* Honeypot: invisible para las personas, irresistible para los bots. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="absolute h-0 w-0 overflow-hidden opacity-0"
      />

      {status === 'error' && (
        <p className="mt-4 text-sm text-red-400">
          {field === 'name' ? a.invalidName : field === 'phone' ? a.invalidPhone : a.error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="btn-axis mt-6 w-full disabled:opacity-60"
      >
        {status === 'sending' ? a.sending : a.submit}
        <Icon name="arrow" size={18} />
      </button>
      <p className="mt-3 text-xs leading-relaxed text-warm-gray/45">{a.privacy}</p>
    </form>
  )
}
