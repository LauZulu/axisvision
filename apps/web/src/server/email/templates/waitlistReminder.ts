import { button, buttonGhost, eyebrow, h1, note, p } from '../components'
import { renderHtml, renderText } from '../layout'
import { esc, formatCop } from '../format'
import type { EmailDoc, WaitlistReminderData } from '../types'
import { REASON_WAITLIST } from './_shared'

/**
 * Cierre del ciclo de la reserva, unos días después del aviso de disponibilidad.
 * Dos caras según lo que haya pasado con el inventario:
 *
 *  - `soldOutAgain: true`  → se volvió a agotar. Le decimos la verdad y le
 *    ofrecemos quedarse en la lista. Enterarse por su cuenta de que llegó tarde
 *    es peor que recibir el correo.
 *  - `soldOutAgain: false` → sigue habiendo unidades. Último recordatorio.
 *
 * En ambos casos es el ÚLTIMO correo de este ciclo: después de esto la reserva
 * se cierra y no se le vuelve a escribir sin que se apunte otra vez.
 */
export function renderWaitlistReminder(data: WaitlistReminderData): EmailDoc {
  const preheader = data.soldOutAgain
    ? 'Se agotaron otra vez. Te contamos qué sigue.'
    : `Todavía quedan ${data.unitsLeft} ${data.unitsLeft === 1 ? 'unidad' : 'unidades'}.`

  const body = data.soldOutAgain
    ? [
        eyebrow('Agotado de nuevo'),
        h1('Se fueron rápido.'),
        p(
          `Las <strong style="color:#f5f3ee;">AXIS ${esc(
            data.productName,
          )}</strong> se agotaron otra vez. Preferimos decírtelo a dejarte descubrirlo en la ficha.`,
        ),
        p(
          'Sigues en la lista: cuando entre el próximo lote te avisamos igual que esta vez, antes que a nadie más.',
        ),
        buttonGhost(data.productUrl, 'Ver otros modelos'),
        note('Si prefieres que dejemos de escribirte por este modelo, puedes darte de baja abajo.'),
      ]
    : [
        eyebrow('Últimas unidades'),
        h1('Todavía quedan.'),
        p(
          `Quedan <strong style="color:#f5f3ee;">${data.unitsLeft} ${
            data.unitsLeft === 1 ? 'unidad' : 'unidades'
          }</strong> de las AXIS ${esc(data.productName)} a ${esc(formatCop(data.priceCop))}.`,
        ),
        p('Es el último recordatorio que te mandamos por este modelo.'),
        button(data.productUrl, 'Comprarlas ahora'),
      ]

  const text = renderText({
    lines: data.soldOutAgain
      ? [
          `Las AXIS ${data.productName} se agotaron otra vez.`,
          'Sigues en la lista: cuando entre el próximo lote te avisamos antes que a nadie más.',
          '',
          `Ver otros modelos: ${data.productUrl}`,
        ]
      : [
          `Quedan ${data.unitsLeft} ${data.unitsLeft === 1 ? 'unidad' : 'unidades'} de las AXIS ${
            data.productName
          } a ${formatCop(data.priceCop)}.`,
          'Es el último recordatorio que te mandamos por este modelo.',
          '',
          `Comprarlas: ${data.productUrl}`,
        ],
    reason: REASON_WAITLIST,
    unsubscribeUrl: data.unsubscribeUrl,
  })

  return {
    subject: data.soldOutAgain
      ? `Se agotaron las AXIS ${data.productName}`
      : `Últimas unidades de las AXIS ${data.productName}`,
    preheader,
    html: renderHtml({
      preheader,
      body: body.join('\n'),
      reason: REASON_WAITLIST,
      unsubscribeUrl: data.unsubscribeUrl,
    }),
    text,
  }
}
