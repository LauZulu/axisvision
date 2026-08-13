'use client'

import { useState } from 'react'
import { useDict } from '../../i18n/useDict'

export type SignupStatus = 'idle' | 'sending' | 'active' | 'already' | 'pending' | 'error'

export type SignupInput = {
  productId: string
  name: string
  phone: string
  /** Opcional de verdad: vacío o ausente = esa persona no dejó correo. */
  email?: string
  /** Lo que haya escrito un bot en el campo trampa. Se manda tal cual. */
  website?: string
}

/**
 * Alta en la lista de espera — solo la parte de red.
 *
 * Existe porque hay DOS formularios que dan de alta lo mismo con campos
 * distintos: el de la ficha de producto (`WaitlistForm`, con correo opcional) y
 * el de `/reservas` (`ReservaPicker`, solo modelo + nombre + WhatsApp). Lo que
 * comparten es exactamente esto: el cuerpo de la petición, el honeypot y cómo
 * se traduce la respuesta a un estado de pantalla. Duplicarlo era la vía rápida
 * para que un día el endpoint cambiara y solo uno de los dos se enterara.
 *
 * La validación NO vive aquí a propósito: cada formulario pide campos distintos
 * y necesita marcar el suyo en rojo.
 */
export function useWaitlistSignup(source: 'sold_out' | 'preview') {
  const { lang } = useDict()
  const [status, setStatus] = useState<SignupStatus>('idle')

  async function submit(input: SignupInput): Promise<void> {
    if (status === 'sending') return
    setStatus('sending')
    try {
      const res = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          productId: input.productId,
          name: input.name.trim(),
          phone: input.phone.trim(),
          email: input.email?.trim() ?? '',
          source,
          locale: lang,
          website: input.website ?? '',
        }),
      })
      if (!res.ok) throw new Error('request failed')
      const data = (await res.json()) as { status?: SignupStatus }
      setStatus(data.status === 'already' || data.status === 'pending' ? data.status : 'active')
    } catch (err) {
      console.error('[reservas] no se pudo enviar la reserva:', err)
      setStatus('error')
    }
  }

  return { status, setStatus, submit }
}

/** Estados en los que ya no hay formulario que enseñar, sino respuesta. */
export function isDone(status: SignupStatus): boolean {
  return status === 'active' || status === 'already' || status === 'pending'
}
