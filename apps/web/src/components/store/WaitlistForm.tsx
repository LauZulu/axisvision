'use client'

import { useState, type FormEvent } from 'react'
import { Icon } from '../ui/Icon'
import { useDict } from '../../i18n/useDict'
import { fill } from '../../lib/format'
import { normalizePhone } from '../../lib/phone'

type Status = 'idle' | 'sending' | 'active' | 'already' | 'pending' | 'error'
type FieldError = 'name' | 'phone' | 'email' | null

/**
 * "Avísame cuando esté disponible."
 *
 * Aparece en dos situaciones: modelo agotado (`source='sold_out'`) y tienda sin
 * pagos abiertos (`source='preview'`). Guarda el contacto en la lista de espera;
 * el aviso lo dispara después el inventario, no este formulario.
 *
 * **Pide nombre y WhatsApp; el correo es opcional.** El canal por el que de
 * verdad se responde en Colombia es WhatsApp, así que ese es el dato que no
 * puede faltar — y por eso el aviso de quien no deja correo lo escribe una
 * persona desde /admin/reservas, no Brevo.
 *
 * El teléfono se valida con `normalizePhone()`, la MISMA función que usa el
 * servidor al guardar: si aquí pasa, allá entra.
 *
 * El campo `website` es una trampa para bots: va oculto y con `tabIndex={-1}`,
 * así que ninguna persona lo llena. Si llega con contenido, el servidor
 * responde 201 sin guardar nada.
 */
export function WaitlistForm({
  productId,
  source,
  className = '',
}: {
  productId: string
  source: 'sold_out' | 'preview'
  className?: string
}) {
  const { t, lang } = useDict()
  const w = t.store.waitlist
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [field, setField] = useState<FieldError>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (status === 'sending') return

    if (name.trim().length < 2) return fail('name')
    if (!normalizePhone(phone)) return fail('phone')
    // El correo solo se valida si lo escribieron: vacío es una respuesta válida.
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return fail('email')

    setField(null)
    setStatus('sending')
    try {
      const res = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          productId,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          source,
          locale: lang,
          website,
        }),
      })
      if (!res.ok) throw new Error('request failed')
      const data = (await res.json()) as { status?: Status }
      setStatus(data.status === 'already' || data.status === 'pending' ? data.status : 'active')
    } catch (err) {
      console.error('[reservas] no se pudo enviar la reserva:', err)
      setStatus('error')
    }
  }

  function fail(which: Exclude<FieldError, null>) {
    setField(which)
    setStatus('error')
  }

  /** Al escribir se borra el error: seguir en rojo mientras corrigen estorba. */
  function edit(set: (v: string) => void) {
    return (value: string) => {
      set(value)
      if (status === 'error') {
        setStatus('idle')
        setField(null)
      }
    }
  }

  if (status === 'active' || status === 'already' || status === 'pending') {
    const title = status === 'already' ? w.alreadyTitle : status === 'pending' ? w.pendingTitle : w.okTitle
    // Sin correo el aviso llega por WhatsApp — prometer un correo que nunca va a
    // salir es la forma más rápida de que la persona lo dé por perdido.
    const body =
      status === 'already'
        ? w.alreadyBody
        : status === 'pending'
          ? fill(w.pendingBody, { email: email.trim() })
          : email.trim()
            ? fill(w.okBody, { email: email.trim() })
            : w.okBodyWhatsapp
    return (
      <div className={`rounded-xl border border-gold/40 bg-carbon-800/60 p-5 ${className}`}>
        <p className="flex items-center gap-2 font-head text-warm-white">
          <Icon name="check" size={18} className="shrink-0 text-gold" />
          {title}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-warm-gray/75">{body}</p>
      </div>
    )
  }

  const inputCls =
    'w-full rounded-md border border-line bg-carbon-900 px-3 py-2.5 text-warm-white outline-none focus:border-gold/60'
  const errorMsg =
    field === 'name' ? w.invalidName : field === 'phone' ? w.invalidPhone : field === 'email' ? w.invalidEmail : w.error

  return (
    <form onSubmit={onSubmit} className={`rounded-xl border border-line bg-carbon-800/40 p-5 ${className}`}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="waitlist-name" className="eyebrow text-gold">
            {w.nameLabel}
          </label>
          <input
            id="waitlist-name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => edit(setName)(e.target.value)}
            placeholder={w.namePlaceholder}
            className={`mt-3 ${inputCls}`}
          />
        </div>

        <div>
          <label htmlFor="waitlist-phone" className="eyebrow text-gold">
            {w.phoneLabel}
          </label>
          <input
            id="waitlist-phone"
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => edit(setPhone)(e.target.value)}
            placeholder={w.phonePlaceholder}
            className={`mt-3 ${inputCls}`}
          />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="waitlist-email" className="eyebrow text-gold">
          {w.emailLabel}
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            id="waitlist-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => edit(setEmail)(e.target.value)}
            placeholder={w.emailPlaceholder}
            className={inputCls}
          />
          <button type="submit" disabled={status === 'sending'} className="btn-axis shrink-0 disabled:opacity-60">
            {status === 'sending' ? w.sending : w.submit}
          </button>
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

      <p className="mt-3 text-xs leading-relaxed text-warm-gray/55">
        {status === 'error' ? <span className="text-gold">{errorMsg}</span> : w.privacy}
      </p>
    </form>
  )
}
