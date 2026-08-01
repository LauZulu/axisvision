import { EMAIL, FONT } from './theme'
import { esc, escUrl, siteUrl } from './format'
import { SALES_EMAIL, WHATSAPP_NUMBER, whatsappLink } from '../../config/brand'

/**
 * Lienzo compartido por todos los correos: cabecera, cuerpo y pie.
 *
 * Decisiones que conviene no revertir sin motivo:
 *  - La cabecera es TEXTO, no un logo en imagen. Gmail y Outlook bloquean
 *    imágenes remotas por defecto en el primer correo de un remitente nuevo; un
 *    logo en imagen se vería como un rectángulo roto justo arriba. Cuando el
 *    dominio tenga reputación se puede cambiar por un PNG en `site/brand/`.
 *  - Fondo carbón declarado con `bgcolor` ADEMÁS del CSS inline, y
 *    `color-scheme: dark` en el <head>: así el modo oscuro de Apple Mail y
 *    Outlook no reinvierte los colores (ya somos oscuros).
 *  - Ancho 600px con un `<style>` que baja los paddings en móvil. El resto del
 *    diseño es fluido, no depende de la media query.
 */

export type LayoutOptions = {
  /** Texto de vista previa. Va oculto al inicio del cuerpo. */
  preheader: string
  /** HTML del contenido (bloques de components.ts, ya concatenados). */
  body: string
  /** Por qué recibe este correo. Obligatorio: baja los reportes de spam. */
  reason: string
  /** Solo en correos de lista (reserva). Añade el enlace de baja al pie. */
  unsubscribeUrl?: string | null
  /** Correo interno para el equipo: quita los CTA comerciales del pie. */
  internal?: boolean
}

const WA_SUPPORT = whatsappLink('general', 'Hola AXIS, tengo una pregunta sobre mi pedido.')

/** Número de WhatsApp legible: 573123727253 → +57 312 372 7253 */
function prettyPhone(): string {
  const d = WHATSAPP_NUMBER
  return `+${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8)}`
}

function header(): string {
  return `<tr>
    <td class="px" align="center" style="padding:36px 32px 28px;">
      <a href="${escUrl(siteUrl())}" style="text-decoration:none;">
        <span style="font-family:${FONT.head};font-size:22px;font-weight:600;letter-spacing:0.42em;color:${EMAIL.warmWhite};text-transform:uppercase;">AXIS</span>
      </a>
      <div style="margin-top:10px;font-family:${FONT.mono};font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:${EMAIL.gold};">Vision</div>
    </td>
  </tr>
  <tr>
    <td style="padding:0 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td height="1" style="height:1px;line-height:1px;font-size:1px;background-color:${EMAIL.goldDeep};">&nbsp;</td>
      </tr></table>
    </td>
  </tr>`
}

function footer(opts: LayoutOptions): string {
  const contact = opts.internal
    ? ''
    : `<p style="margin:0 0 14px;font-family:${FONT.body};font-size:14px;line-height:1.6;color:${EMAIL.warmGray};">
        ¿Necesitas algo? Escríbenos por
        <a href="${escUrl(WA_SUPPORT)}" style="color:${EMAIL.gold};text-decoration:underline;">WhatsApp ${esc(prettyPhone())}</a>
        o a <a href="mailto:${esc(SALES_EMAIL)}" style="color:${EMAIL.gold};text-decoration:underline;">${esc(SALES_EMAIL)}</a>.
      </p>
      <p style="margin:0 0 18px;font-family:${FONT.body};font-size:13px;line-height:1.6;color:#8f8d87;">Envíos a toda Colombia. Precios en pesos colombianos (COP), IVA incluido.</p>`

  const unsub = opts.unsubscribeUrl
    ? `<p style="margin:14px 0 0;font-family:${FONT.body};font-size:12px;line-height:1.6;color:#77756f;">
        <a href="${escUrl(opts.unsubscribeUrl)}" style="color:#77756f;text-decoration:underline;">Darme de baja de este aviso</a>
      </p>`
    : ''

  return `<tr>
    <td style="padding:8px 32px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td height="1" style="height:1px;line-height:1px;font-size:1px;background-color:${EMAIL.carbon700};">&nbsp;</td>
      </tr></table>
    </td>
  </tr>
  <tr>
    <td class="px" style="padding:26px 32px 40px;">
      ${contact}
      <p style="margin:0;font-family:${FONT.body};font-size:12px;line-height:1.6;color:#77756f;">${esc(opts.reason)}</p>
      <p style="margin:10px 0 0;font-family:${FONT.body};font-size:12px;line-height:1.6;color:#77756f;">
        AXIS Vision · Gafas con inteligencia artificial · Colombia<br />
        Tratamos tus datos conforme a la Ley 1581 de 2012 (habeas data).
      </p>
      ${unsub}
    </td>
  </tr>`
}

export function renderHtml(opts: LayoutOptions): string {
  return `<!doctype html>
<html lang="es" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="dark" />
<meta name="supported-color-schemes" content="dark" />
<!--[if mso]>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
<![endif]-->
<style>
  body { margin:0; padding:0; width:100% !important; background-color:${EMAIL.carbon900}; }
  table { border-collapse:collapse; }
  img { -ms-interpolation-mode:bicubic; }
  a { color:${EMAIL.gold}; }
  /* Evita que iOS/Gmail conviertan teléfonos y referencias en enlaces azules. */
  a[x-apple-data-detectors] { color:inherit !important; text-decoration:none !important; }
  u + #body a { color:inherit; text-decoration:none; }
  @media only screen and (max-width:620px) {
    .wrap { width:100% !important; }
    .px { padding-left:22px !important; padding-right:22px !important; }
  }
</style>
</head>
<body id="body" style="margin:0;padding:0;background-color:${EMAIL.carbon900};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${EMAIL.carbon900};">${esc(opts.preheader)}</div>
<!-- Relleno invisible: evita que Gmail pegue el preheader al primer texto real. -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${EMAIL.carbon900}" style="background-color:${EMAIL.carbon900};">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" class="wrap" width="${EMAIL.width}" cellpadding="0" cellspacing="0" border="0" bgcolor="${EMAIL.carbon850}" style="width:${EMAIL.width}px;max-width:${EMAIL.width}px;background-color:${EMAIL.carbon850};">
        ${header()}
        <tr>
          <td class="px" style="padding:34px 32px 8px;">
            ${opts.body}
          </td>
        </tr>
        ${footer(opts)}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

export type TextOptions = {
  /** Líneas del cuerpo. Una cadena vacía = línea en blanco. */
  lines: string[]
  reason: string
  unsubscribeUrl?: string | null
  internal?: boolean
}

/** Versión en texto plano, con el mismo pie. */
export function renderText(opts: TextOptions): string {
  const out = ['AXIS VISION', '', ...opts.lines, '', '—']
  if (!opts.internal) {
    out.push(`WhatsApp ${prettyPhone()} · ${SALES_EMAIL}`, 'Envíos a toda Colombia. Precios en COP, IVA incluido.')
  }
  out.push(opts.reason)
  if (opts.unsubscribeUrl) out.push(`Darte de baja: ${opts.unsubscribeUrl}`)
  return out.join('\n')
}
