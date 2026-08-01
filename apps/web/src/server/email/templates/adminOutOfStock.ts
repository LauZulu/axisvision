import { button, dataList, eyebrow, h1, note, p, panel } from '../components'
import { renderHtml, renderText } from '../layout'
import { esc } from '../format'
import type { AdminOutOfStockData, EmailDoc } from '../types'
import { REASON_INTERNAL } from './_shared'

/**
 * Aviso interno: un modelo se quedó en cero. Se dispara desde
 * `syncStockFromUnits()`, en la transición contraria a la del aviso de
 * disponibilidad (>0 → 0).
 *
 * El número que importa no es el cero, es cuánta gente quedó esperando: eso
 * decide qué modelo reponer primero.
 */
export function renderAdminOutOfStock(data: AdminOutOfStockData): EmailDoc {
  const preheader = data.waitingCount
    ? `${data.waitingCount} en lista de espera`
    : 'Sin unidades disponibles'

  const body = [
    eyebrow('Inventario'),
    h1(`Se agotó ${data.productName}`),
    panel(
      dataList([
        { label: 'Modelo', value: data.modelCode || '—' },
        { label: 'Disponibles', value: '0' },
        { label: 'En espera', value: String(data.waitingCount) },
      ]),
      { accent: true },
    ),
    p(
      data.waitingCount > 0
        ? `Hay <strong style="color:#f5f3ee;">${data.waitingCount} ${
            data.waitingCount === 1 ? 'persona' : 'personas'
          }</strong> esperando este modelo. Se les avisa solo cuando vuelva a haber unidades vendibles en casa o local.`
        : 'Nadie está esperando este modelo por ahora.',
    ),
    button(data.adminUrl, 'Ver inventario'),
    note(
      `La ficha de ${esc(
        data.productName,
      )} ya no muestra el botón de compra: en su lugar aparece el de avisarme cuando llegue.`,
    ),
  ].join('\n')

  const text = renderText({
    lines: [
      `SE AGOTÓ: ${data.productName} (${data.modelCode || '—'})`,
      `Disponibles: 0`,
      `En lista de espera: ${data.waitingCount}`,
      '',
      `Inventario: ${data.adminUrl}`,
    ],
    reason: REASON_INTERNAL,
    internal: true,
  })

  return {
    subject: `[AXIS] Se agotó ${data.productName}`,
    preheader,
    html: renderHtml({ preheader, body, reason: REASON_INTERNAL, internal: true }),
    text,
  }
}
