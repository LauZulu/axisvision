import { button, eyebrow, h1, note, p } from '../components'
import { renderHtml, renderText } from '../layout'
import { esc } from '../format'
import type { AdminPasswordResetData, EmailDoc } from '../types'
import { REASON_INTERNAL, greeting, greetingText } from './_shared'

/**
 * Restablecer la contraseña del panel. Único correo de la cuenta de admin: no
 * hay cuentas de cliente (la tienda es de compra como invitado).
 *
 * El enlace lleva un token de un solo uso y vida corta; el correo dice cuánto
 * dura y desde dónde se pidió, que es lo que permite notar un intento ajeno.
 */
export function renderAdminPasswordReset(data: AdminPasswordResetData): EmailDoc {
  const preheader = `El enlace vence en ${data.expiresMinutes} minutos.`

  const body = [
    eyebrow('Panel AXIS'),
    h1('Restablece tu contraseña.'),
    p(`${greeting(data.name)} Alguien pidió restablecer la contraseña de tu cuenta del panel.`),
    button(data.resetUrl, 'Crear una contraseña nueva'),
    p(
      `El enlace vence en <strong style="color:#f5f3ee;">${data.expiresMinutes} minutos</strong> y solo sirve una vez.`,
    ),
    note(
      data.requestIp
        ? `Solicitud hecha desde la IP ${esc(
            data.requestIp,
          )}. Si no fuiste tú, ignora este correo: la contraseña actual sigue funcionando.`
        : 'Si no fuiste tú, ignora este correo: la contraseña actual sigue funcionando.',
    ),
  ].join('\n')

  const text = renderText({
    lines: [
      greetingText(data.name),
      'Alguien pidió restablecer la contraseña de tu cuenta del panel de AXIS.',
      '',
      `Crear una contraseña nueva: ${data.resetUrl}`,
      '',
      `El enlace vence en ${data.expiresMinutes} minutos y solo sirve una vez.`,
      ...(data.requestIp ? [`Solicitud hecha desde la IP ${data.requestIp}.`] : []),
      'Si no fuiste tú, ignora este correo: la contraseña actual sigue funcionando.',
    ],
    reason: REASON_INTERNAL,
    internal: true,
  })

  return {
    subject: 'Restablecer tu contraseña del panel AXIS',
    preheader,
    html: renderHtml({ preheader, body, reason: REASON_INTERNAL, internal: true }),
    text,
  }
}
