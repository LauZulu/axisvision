import { button, eyebrow, h1, note, p } from '../components'
import { renderHtml, renderText } from '../layout'
import { EMAIL, FONT } from '../theme'
import { esc, formatDate } from '../format'
import type { AdminWaitlistDigestData, EmailDoc } from '../types'
import { REASON_INTERNAL } from './_shared'

/**
 * Resumen periódico de la demanda represada: cuánta gente espera cada modelo.
 * Pensado para un cron semanal.
 *
 * Es el correo que convierte la lista de espera en una herramienta de compra:
 * dice qué reponer primero y cuánto, con dinero real detrás de cada fila.
 */
export function renderAdminWaitlistDigest(data: AdminWaitlistDigestData): EmailDoc {
  const total = data.rows.reduce((sum, r) => sum + r.waitingCount, 0)
  const preheader = `${total} ${total === 1 ? 'persona esperando' : 'personas esperando'} en ${
    data.rows.length
  } ${data.rows.length === 1 ? 'modelo' : 'modelos'}`

  const th = `padding:10px 12px 10px 0;border-bottom:1px solid ${EMAIL.carbon700};font-family:${FONT.mono};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${EMAIL.gold};text-align:left;`
  const td = `padding:12px 12px 12px 0;border-bottom:1px solid ${EMAIL.carbon700};font-family:${FONT.body};font-size:15px;color:${EMAIL.warmWhite};`

  const table = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
    <tr><th style="${th}">Modelo</th><th style="${th}">Esperando</th><th style="${th}text-align:right;padding-right:0;">Stock</th></tr>
    ${data.rows
      .map(
        (r) => `<tr>
        <td style="${td}">${esc(r.productName)}<div style="font-family:${FONT.mono};font-size:11px;color:#8f8d87;margin-top:3px;">${esc(
          r.modelCode || '—',
        )}</div></td>
        <td style="${td}">${r.waitingCount}</td>
        <td style="${td}text-align:right;padding-right:0;color:${
          r.unitsLeft === 0 ? EMAIL.gold : EMAIL.warmWhite
        };">${r.unitsLeft}</td>
      </tr>`,
      )
      .join('\n')}
  </table>`

  const body = [
    eyebrow('Lista de espera'),
    h1(`${total} ${total === 1 ? 'persona esperando' : 'personas esperando'}`),
    p(`Acumulado desde el ${esc(formatDate(data.since))}.`),
    data.rows.length ? table : p('Nadie en lista de espera este periodo.'),
    button(data.adminUrl, 'Abrir el panel'),
    note('Las filas con stock 0 y gente esperando son las que hay que reponer primero.'),
  ].join('\n')

  const text = renderText({
    lines: [
      `LISTA DE ESPERA — ${total} ${total === 1 ? 'persona' : 'personas'}`,
      `Desde el ${formatDate(data.since)}`,
      '',
      ...data.rows.map(
        (r) => `- ${r.productName} (${r.modelCode || '—'}): ${r.waitingCount} esperando · stock ${r.unitsLeft}`,
      ),
      '',
      `Panel: ${data.adminUrl}`,
    ],
    reason: REASON_INTERNAL,
    internal: true,
  })

  return {
    subject: `[AXIS] ${total} ${total === 1 ? 'persona' : 'personas'} en lista de espera`,
    preheader,
    html: renderHtml({ preheader, body, reason: REASON_INTERNAL, internal: true }),
    text,
  }
}
