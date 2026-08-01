import { buttonGhost, eyebrow, h1, note, p } from '../components'
import { renderHtml, renderText } from '../layout'
import { esc, siteUrl } from '../format'
import type { EmailDoc, WaitlistData } from '../types'
import { REASON_WAITLIST } from './_shared'

/**
 * Confirmación de baja. Se manda UNA vez, sin enlace de baja en el pie (ya no
 * hay de qué darse de baja) y sin intentar retener a nadie: un correo que
 * pregunta "¿seguro?" después de que la persona ya dijo que no es exactamente
 * lo que hace que la próxima vez pulse "spam" en vez del enlace.
 */
export function renderWaitlistUnsubscribed(data: WaitlistData): EmailDoc {
  const preheader = 'Listo, no te escribimos más por este modelo.'

  const body = [
    eyebrow('Baja confirmada'),
    h1('Listo.'),
    p(
      `Ya no te avisaremos cuando vuelvan las <strong style="color:#f5f3ee;">AXIS ${esc(
        data.productName,
      )}</strong>. Borramos tu correo de esa lista.`,
    ),
    p('Si algún día cambias de idea, puedes volver a apuntarte desde la ficha del modelo.'),
    buttonGhost(siteUrl('/tienda'), 'Ir a la tienda'),
    note('Este es el último correo que recibes por esta lista. Los correos de un pedido tuyo, si llegas a comprar, siguen llegando aparte.'),
  ].join('\n')

  const text = renderText({
    lines: [
      `Ya no te avisaremos cuando vuelvan las AXIS ${data.productName}. Borramos tu correo de esa lista.`,
      'Si algún día cambias de idea, puedes volver a apuntarte desde la ficha del modelo.',
      '',
      `Tienda: ${siteUrl('/tienda')}`,
    ],
    reason: REASON_WAITLIST,
  })

  return {
    subject: 'Diste de baja el aviso de disponibilidad',
    preheader,
    html: renderHtml({ preheader, body, reason: REASON_WAITLIST }),
    text,
  }
}
