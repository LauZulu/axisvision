'use client'

import { useState, type FormEvent } from 'react'
import { Icon } from '../ui/Icon'
import { useDict } from '../../i18n/useDict'
import { fill } from '../../lib/format'

type Status = 'idle' | 'sending' | 'active' | 'already' | 'pending' | 'error'

/**
 * "Avísame cuando esté disponible."
 *
 * Aparece en dos situaciones: modelo agotado (`source='sold_out'`) y tienda sin
 * pagos abiertos (`source='preview'`). Guarda el correo en la lista de espera;
 * el aviso lo dispara después el inventario, no este formulario.
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
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (status === 'sending') return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error')
      return
    }
    setStatus('sending')
    try {
      const res = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ productId, email, source, locale: lang, website }),
      })
      if (!res.ok) throw new Error('request failed')
      const data = (await res.json()) as { status?: Status }
      setStatus(data.status === 'already' || data.status === 'pending' ? data.status : 'active')
    } catch (err) {
      console.error('[reservas] no se pudo enviar la reserva:', err)
      setStatus('error')
    }
  }

  if (status === 'active' || status === 'already' || status === 'pending') {
    const title = status === 'already' ? w.alreadyTitle : status === 'pending' ? w.pendingTitle : w.okTitle
    const body =
      status === 'already'
        ? w.alreadyBody
        : fill(status === 'pending' ? w.pendingBody : w.okBody, { email })
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

  return (
    <form onSubmit={onSubmit} className={`rounded-xl border border-line bg-carbon-800/40 p-5 ${className}`}>
      <label htmlFor="waitlist-email" className="eyebrow text-gold">
        {w.emailLabel}
      </label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input
          id="waitlist-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (status === 'error') setStatus('idle')
          }}
          placeholder={w.emailPlaceholder}
          className="w-full rounded-md border border-line bg-carbon-900 px-3 py-2.5 text-warm-white outline-none focus:border-gold/60"
        />
        <button type="submit" disabled={status === 'sending'} className="btn-axis shrink-0 disabled:opacity-60">
          {status === 'sending' ? w.sending : w.submit}
        </button>
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
        {status === 'error' ? <span className="text-gold">{w.error}</span> : w.privacy}
      </p>
    </form>
  )
}
