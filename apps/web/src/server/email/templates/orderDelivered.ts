import { button, eyebrow, h1, h2, lead, note, p, spacer } from '../components'
import { renderHtml, renderText } from '../layout'
import { siteUrl } from '../format'
import type { EmailDoc, OrderDeliveredData } from '../types'
import { REASON_ORDER, greeting, greetingText } from './_shared'

/**
 * Pedido entregado. No es un trámite: es el único correo que se lee con las
 * gafas puestas, así que sirve para lo que de verdad reduce soporte — cómo
 * cargarlas, cómo cuidarlas — y solo al final pide la reseña.
 *
 * Si no hay `reviewUrl`, el correo cierra sin pedir nada.
 */
export function renderOrderDelivered(data: OrderDeliveredData): EmailDoc {
  const preheader = 'Tres cosas para sacarles todo el provecho desde hoy.'

  const body = [
    eyebrow('Entregado'),
    h1('Ya las tienes.'),
    p(`${greeting(data.customerName)} Tu pedido ${data.reference} figura como entregado.`),
    lead('Ahora empieza lo bueno.'),
    spacer(8),
    h2('Para empezar'),
    // TODO[AXIS]: reemplazar por los pasos exactos del manual del fabricante
    // (nombre del botón, indicador de carga, app de emparejamiento). Hoy están
    // redactados en genérico a propósito: es preferible decir de menos que
    // describir un botón que no existe.
    p(
      '<strong style="color:#f5f3ee;">Cárgalas por completo antes del primer uso.</strong> La primera carga completa es la que fija la autonomía real de la batería.',
    ),
    p(
      '<strong style="color:#f5f3ee;">Empareja con tu teléfono.</strong> Sigue los pasos de la guía que viene en la caja; si algo no cuadra, te acompañamos por WhatsApp.',
    ),
    p(
      '<strong style="color:#f5f3ee;">Límpialas en seco, con el paño de microfibra.</strong> Los limpiadores con alcohol dañan el tratamiento polarizado del lente.',
    ),
    data.reviewUrl
      ? [
          h2('¿Cómo te fue?'),
          p('Si te tomas dos minutos para contarnos qué tal, nos ayudas a decidir qué construir después.'),
          button(data.reviewUrl, 'Dejar mi opinión'),
        ].join('\n')
      : '',
    note(
      `¿Algo no está bien? Escríbenos por WhatsApp con la referencia ${data.reference} y lo resolvemos.`,
    ),
  ]
    .filter(Boolean)
    .join('\n')

  const text = renderText({
    lines: [
      greetingText(data.customerName),
      `Tu pedido ${data.reference} figura como entregado.`,
      '',
      'PARA EMPEZAR',
      '1. Cárgalas por completo antes del primer uso.',
      '2. Empareja con tu teléfono siguiendo la guía de la caja.',
      '3. Límpialas en seco, solo con el paño de microfibra.',
      ...(data.reviewUrl ? ['', `Cuéntanos cómo te fue: ${data.reviewUrl}`] : []),
      '',
      `Tienda: ${siteUrl('/tienda')}`,
    ],
    reason: REASON_ORDER,
  })

  return {
    subject: 'Tus AXIS ya están contigo',
    preheader,
    html: renderHtml({ preheader, body, reason: REASON_ORDER }),
    text,
  }
}
