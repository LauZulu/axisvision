import { button, eyebrow, h1, image, note, p, spacer } from '../components'
import { renderHtml, renderText } from '../layout'
import { esc } from '../format'
import type { EmailDoc, WaitlistData } from '../types'
import { REASON_WAITLIST } from './_shared'

/**
 * "Quedaste en la lista." Se manda al confirmar el correo (o directo al
 * apuntarse, si se decide arrancar sin doble opt-in).
 *
 * No promete fecha. El inventario son unidades físicas que entran de a pocas;
 * prometer "en dos semanas" y fallar cuesta más que no decir nada.
 */
export function renderWaitlistConfirm(data: WaitlistData): EmailDoc {
  const preheader = `Te avisamos apenas entren unidades de las ${data.productName}.`

  const body = [
    eyebrow('Estás en la lista'),
    h1('Te avisamos.'),
    data.imageUrl ? image(data.imageUrl, `AXIS ${data.productName}`) : '',
    data.imageUrl ? spacer(20) : '',
    p(
      `Quedaste anotado para las <strong style="color:#f5f3ee;">AXIS ${esc(
        data.productName,
      )}</strong>. Cuando entren unidades te escribimos a este correo, antes de anunciarlo en cualquier otro lado.`,
    ),
    p(
      'Cada AXIS es una unidad física de nuestro inventario, no un producto que se fabrica bajo demanda: los lotes son pequeños y se van rápido.',
    ),
    button(data.productUrl, 'Ver el modelo'),
    note('Te escribimos una sola vez por este modelo. Nada de boletines.'),
  ]
    .filter(Boolean)
    .join('\n')

  const text = renderText({
    lines: [
      `Quedaste anotado para las AXIS ${data.productName}.`,
      'Cuando entren unidades te escribimos a este correo, antes de anunciarlo en cualquier otro lado.',
      '',
      `Ver el modelo: ${data.productUrl}`,
      '',
      'Te escribimos una sola vez por este modelo. Nada de boletines.',
    ],
    reason: REASON_WAITLIST,
    unsubscribeUrl: data.unsubscribeUrl,
  })

  return {
    subject: `Estás en la lista para las AXIS ${data.productName}`,
    preheader,
    html: renderHtml({ preheader, body, reason: REASON_WAITLIST, unsubscribeUrl: data.unsubscribeUrl }),
    text,
  }
}
