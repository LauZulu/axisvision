import { button, eyebrow, h1, h2, note, p, quote } from '../components'
import { renderHtml, renderText } from '../layout'
import { whatsappLink } from '../../../config/brand'
import type { EmailDoc, PrescriptionData } from '../types'
import { REASON_ORDER, greeting, greetingText } from './_shared'

/**
 * Siguiente paso cuando el pedido lleva lentes con fórmula médica.
 *
 * Es el hueco más grande de la experiencia actual: el comprador elige "fórmula
 * médica" en la ficha, paga, y se queda sin saber qué sigue. Este correo le
 * devuelve la nota que él mismo escribió (para que confirme o corrija) y le
 * abre el canal para mandar la fórmula.
 *
 * Se envía junto con la confirmación de pago, no antes: hasta que no hay pago
 * no hay nada que montar.
 */
export function renderPrescriptionNextSteps(data: PrescriptionData): EmailDoc {
  const preheader = 'Confirmemos tu fórmula para montar los lentes.'
  const wa = whatsappLink(
    'general',
    `Hola AXIS. Les envío la fórmula médica de mi pedido ${data.reference}.`,
  )

  const lensBlocks = data.lines
    .map((l) => {
      const head = h2(`${l.productName}${l.lensOptionName ? ` · ${l.lensOptionName}` : ''}`)
      const body = l.prescriptionNote
        ? quote(l.prescriptionNote)
        : p('No recibimos los datos de la fórmula para esta montura. Mándanoslos y arrancamos.')
      return head + '\n' + body
    })
    .join('\n')

  const body = [
    eyebrow('Fórmula médica'),
    h1('Falta un paso para montar tus lentes.'),
    p(
      `${greeting(data.customerName)} Tu pedido ${data.reference} incluye lentes con fórmula médica. Los montamos con nuestra óptica aliada, y para eso necesitamos confirmar tus datos.`,
    ),
    lensBlocks,
    h2('Cómo seguir'),
    p(
      'Respóndenos por WhatsApp con una <strong style="color:#f5f3ee;">foto de tu fórmula vigente</strong> (o confirma que los datos de arriba están correctos). Con eso mandamos a tallar los lentes y te avisamos cuando las monturas estén listas para salir.',
    ),
    button(data.uploadUrl || wa, 'Enviar mi fórmula'),
    // El pago que acaba de hacer NO incluye el montaje: su valor depende de la
    // graduación y por eso no se anunció en la tienda. Que se entere aquí, y no
    // cuando le pasemos la cuenta.
    p(
      'El montaje de tu fórmula se cotiza aparte y no está incluido en lo que pagaste: al revisar tu fórmula te confirmamos el valor y cómo pagarlo, antes de mandar a tallar nada.',
    ),
    note(
      'La fórmula debe tener menos de un año y venir de un optómetra u oftalmólogo. Si la tuya está vencida, te ayudamos a agendar el examen con la óptica aliada.',
    ),
  ].join('\n')

  const text = renderText({
    lines: [
      greetingText(data.customerName),
      `Tu pedido ${data.reference} incluye lentes con fórmula médica.`,
      '',
      ...data.lines.flatMap((l) => [
        `${l.productName}${l.lensOptionName ? ` · ${l.lensOptionName}` : ''}`,
        l.prescriptionNote || 'Sin datos de fórmula: mándanoslos y arrancamos.',
        '',
      ]),
      'Envíanos una foto de tu fórmula vigente (o confirma que los datos de arriba están correctos):',
      data.uploadUrl || wa,
      '',
      'El montaje de tu fórmula se cotiza aparte y no está incluido en lo que pagaste: al revisarla te confirmamos el valor antes de mandar a tallar.',
      '',
      'La fórmula debe tener menos de un año y venir de un optómetra u oftalmólogo.',
    ],
    reason: REASON_ORDER,
  })

  return {
    subject: `Falta tu fórmula médica · Pedido ${data.reference}`,
    preheader,
    html: renderHtml({ preheader, body, reason: REASON_ORDER }),
    text,
  }
}
