import { button, eyebrow, h1, note, p } from '../components'
import { renderHtml, renderText } from '../layout'
import { esc } from '../format'
import type { EmailDoc, WaitlistVerifyData } from '../types'
import { REASON_WAITLIST } from './_shared'

/**
 * Doble opt-in de la lista de espera.
 *
 * Cualquiera puede escribir el correo de otra persona en un formulario público.
 * Sin esta confirmación, esa dirección recibe correos que nunca pidió, los
 * marca como spam, y la reputación del dominio axisvision.co —el mismo que
 * manda las confirmaciones de pago— se cae. Un paso extra aquí protege los
 * correos que sí tienen que llegar.
 *
 * Este es el ÚNICO correo que se manda a una dirección sin verificar.
 */
export function renderWaitlistVerify(data: WaitlistVerifyData): EmailDoc {
  const preheader = `Un clic y quedas en la lista de las ${data.productName}.`

  const body = [
    eyebrow('Confirma tu correo'),
    h1('Un clic y quedas en la lista.'),
    p(
      `Alguien pidió que avisáramos a esta dirección cuando las <strong style="color:#f5f3ee;">AXIS ${esc(
        data.productName,
      )}</strong> volvieran a estar disponibles.`,
    ),
    p('Si fuiste tú, confírmalo y te avisamos apenas entren unidades.'),
    button(data.verifyUrl, 'Sí, avísenme'),
    note(
      `El enlace vence en ${data.expiresHours} horas. Si no fuiste tú, ignora este correo: sin confirmación no te escribimos nunca más.`,
    ),
  ].join('\n')

  const text = renderText({
    lines: [
      `Alguien pidió que avisáramos a esta dirección cuando las AXIS ${data.productName} volvieran a estar disponibles.`,
      '',
      'Si fuiste tú, confírmalo aquí:',
      data.verifyUrl,
      '',
      `El enlace vence en ${data.expiresHours} horas. Si no fuiste tú, ignora este correo.`,
    ],
    reason: REASON_WAITLIST,
  })

  return {
    subject: `Confirma tu correo para el aviso de las AXIS ${data.productName}`,
    preheader,
    html: renderHtml({ preheader, body, reason: REASON_WAITLIST }),
    text,
  }
}
