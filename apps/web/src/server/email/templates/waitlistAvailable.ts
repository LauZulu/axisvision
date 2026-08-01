import { button, eyebrow, h1, image, note, p, panel, spacer } from '../components'
import { renderHtml, renderText } from '../layout'
import { EMAIL, FONT } from '../theme'
import { esc, formatCop } from '../format'
import type { EmailDoc, WaitlistAvailableData } from '../types'
import { REASON_WAITLIST } from './_shared'

/**
 * "Ya están disponibles" — el correo por el que existe toda la función.
 *
 * Lo dispara la transición de stock 0 → >0 en `syncStockFromUnits()`
 * (src/server/inventory.ts), que es el único punto por donde sube el stock:
 * el admin moviendo una unidad a casa/local, un pago anulado que las devuelve,
 * o el import del Excel.
 *
 * Tres cosas lo hacen convertir, en este orden: llega rápido, dice cuántas
 * quedan de verdad, y lleva directo a la ficha con un solo botón.
 */
export function renderWaitlistAvailable(data: WaitlistAvailableData): EmailDoc {
  const preheader = `${data.unitsLeft} ${
    data.unitsLeft === 1 ? 'unidad disponible' : 'unidades disponibles'
  } · ${formatCop(data.priceCop)}`

  const hasDiscount = data.compareAtPriceCop != null && data.compareAtPriceCop > data.priceCop
  const priceHtml = hasDiscount
    ? `<span style="font-family:${FONT.head};font-size:24px;color:${EMAIL.warmWhite};">${esc(
        formatCop(data.priceCop),
      )}</span> <span style="font-family:${FONT.body};font-size:16px;color:#8f8d87;text-decoration:line-through;">${esc(
        formatCop(data.compareAtPriceCop!),
      )}</span>`
    : `<span style="font-family:${FONT.head};font-size:24px;color:${EMAIL.warmWhite};">${esc(
        formatCop(data.priceCop),
      )}</span>`

  const body = [
    eyebrow('Disponible'),
    h1(`Las ${data.productName} volvieron.`),
    data.imageUrl ? image(data.imageUrl, `AXIS ${data.productName}`) : '',
    data.imageUrl ? spacer(20) : '',
    p(
      `Nos pediste que te avisáramos. Ya hay <strong style="color:#f5f3ee;">${data.unitsLeft} ${
        data.unitsLeft === 1 ? 'unidad' : 'unidades'
      }</strong> de las AXIS ${esc(data.productName)} listas para salir.`,
    ),
    panel(
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="font-family:${FONT.mono};font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${EMAIL.gold};padding-bottom:8px;">AXIS ${esc(
          data.productName,
        )}</td>
      </tr><tr><td>${priceHtml}</td></tr></table>`,
      { accent: true },
    ),
    button(data.productUrl, 'Comprarlas ahora'),
    data.holdHours
      ? note(
          `Avisamos primero a quien estaba en la lista. Pasadas ${data.holdHours} horas abrimos las unidades al resto de la tienda.`,
        )
      : note('No apartamos unidades: se van por orden de compra.'),
  ]
    .filter(Boolean)
    .join('\n')

  const text = renderText({
    lines: [
      `Las AXIS ${data.productName} volvieron.`,
      `Hay ${data.unitsLeft} ${data.unitsLeft === 1 ? 'unidad' : 'unidades'} disponibles.`,
      '',
      `Precio: ${formatCop(data.priceCop)}${
        hasDiscount ? ` (antes ${formatCop(data.compareAtPriceCop!)})` : ''
      }`,
      '',
      `Comprarlas: ${data.productUrl}`,
      '',
      data.holdHours
        ? `Avisamos primero a quien estaba en la lista; pasadas ${data.holdHours} horas abrimos las unidades al resto de la tienda.`
        : 'No apartamos unidades: se van por orden de compra.',
    ],
    reason: REASON_WAITLIST,
    unsubscribeUrl: data.unsubscribeUrl,
  })

  return {
    subject: `Ya están disponibles las AXIS ${data.productName}`,
    preheader,
    html: renderHtml({ preheader, body, reason: REASON_WAITLIST, unsubscribeUrl: data.unsubscribeUrl }),
    text,
  }
}
