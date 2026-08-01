/**
 * Bloques de HTML para correo. Cada función devuelve un string listo para
 * concatenar dentro del cuerpo del layout.
 *
 * Reglas del medio (no son gustos, son límites de los clientes de correo):
 *  - Maquetación con <table>, nunca flex/grid: Outlook usa el motor de Word.
 *  - Todo el CSS inline; las clases del <style> del <head> solo para el ajuste
 *    móvil (Gmail las respeta, pero muchos clientes las descartan).
 *  - Nada de background-image para contenido: se bloquea o no se carga.
 *  - Cada dato de fuera pasa por esc()/escUrl().
 */
import { EMAIL, FONT } from './theme'
import { esc, escUrl, formatCop } from './format'
import type { OrderLine } from './types'

/** Etiqueta mono dorada en mayúsculas (el "eyebrow" del sitio). */
export function eyebrow(text: string): string {
  return `<p style="margin:0 0 14px;font-family:${FONT.mono};font-size:11px;line-height:1.4;letter-spacing:0.22em;text-transform:uppercase;color:${EMAIL.gold};">${esc(text)}</p>`
}

/** Titular principal del correo. */
export function h1(text: string): string {
  return `<h1 style="margin:0 0 16px;font-family:${FONT.head};font-size:28px;line-height:1.2;font-weight:500;letter-spacing:-0.01em;color:${EMAIL.warmWhite};">${esc(text)}</h1>`
}

/** Subtítulo de bloque. */
export function h2(text: string): string {
  return `<h2 style="margin:0 0 12px;font-family:${FONT.head};font-size:17px;line-height:1.3;font-weight:500;color:${EMAIL.warmWhite};">${esc(text)}</h2>`
}

/**
 * Párrafo de cuerpo. `html` entra SIN escapar para poder llevar <strong>/<a>:
 * quien lo llama escapa los datos de fuera antes de pasarlos.
 */
export function p(html: string): string {
  return `<p style="margin:0 0 16px;font-family:${FONT.body};font-size:16px;line-height:1.65;color:${EMAIL.warmGray};">${html}</p>`
}

/** Una frase en serif — el toque de lujo. Máximo una por correo. */
export function lead(text: string): string {
  return `<p style="margin:0 0 20px;font-family:${FONT.serif};font-size:22px;line-height:1.4;font-style:italic;color:${EMAIL.warmWhite};">${esc(text)}</p>`
}

/** Nota al pie de un bloque: gris, pequeña, sin peso visual. */
export function note(html: string): string {
  return `<p style="margin:0 0 12px;font-family:${FONT.body};font-size:13px;line-height:1.6;color:#8f8d87;">${html}</p>`
}

/** Enlace de texto en dorado. */
export function link(href: string, label: string): string {
  return `<a href="${escUrl(href)}" style="color:${EMAIL.gold};text-decoration:underline;">${esc(label)}</a>`
}

/** Espacio vertical (los márgenes se colapsan distinto en cada cliente). */
export function spacer(px = 24): string {
  return `<div style="line-height:${px}px;height:${px}px;font-size:1px;">&nbsp;</div>`
}

/** Filete dorado a media opacidad — el separador de la marca. */
export function hairline(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="1" style="height:1px;line-height:1px;font-size:1px;background-color:${EMAIL.carbon700};">&nbsp;</td></tr></table>`
}

/**
 * Botón "a prueba de balas": la píldora con contorno dorado del sitio. Va sobre
 * <table> para que el área clicable sea toda la celda y no solo el texto.
 * Outlook ignora el border-radius y lo dibuja recto — sigue siendo correcto.
 */
export function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
  <tr>
    <td align="center" bgcolor="${EMAIL.carbon850}" style="border:1px solid ${EMAIL.gold};border-radius:999px;">
      <a href="${escUrl(href)}" style="display:inline-block;padding:15px 32px;font-family:${FONT.head};font-size:15px;font-weight:500;line-height:1;color:${EMAIL.warmWhite};text-decoration:none;">${esc(label)}</a>
    </td>
  </tr>
</table>`
}

/** Botón secundario: mismo tamaño, sin contorno dorado. */
export function buttonGhost(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
  <tr>
    <td align="center" bgcolor="${EMAIL.carbon800}" style="border:1px solid ${EMAIL.carbon700};border-radius:999px;">
      <a href="${escUrl(href)}" style="display:inline-block;padding:15px 32px;font-family:${FONT.head};font-size:15px;font-weight:500;line-height:1;color:${EMAIL.warmGray};text-decoration:none;">${esc(label)}</a>
    </td>
  </tr>
</table>`
}

/** Caja elevada con contorno tenue, para agrupar datos. */
export function panel(innerHtml: string, opts: { accent?: boolean } = {}): string {
  const border = opts.accent ? EMAIL.gold : EMAIL.carbon700
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
  <tr>
    <td bgcolor="${EMAIL.carbon800}" style="padding:22px 24px;border:1px solid ${border};border-radius:4px;">${innerHtml}</td>
  </tr>
</table>`
}

/** Pares etiqueta/valor (referencia, fecha, método de pago…). */
export function dataList(rows: Array<{ label: string; value: string } | null>): string {
  const cells = rows
    .filter((r): r is { label: string; value: string } => Boolean(r))
    .map(
      (r) => `<tr>
      <td style="padding:6px 12px 6px 0;font-family:${FONT.mono};font-size:11px;line-height:1.5;letter-spacing:0.14em;text-transform:uppercase;color:#8f8d87;white-space:nowrap;vertical-align:top;">${esc(r.label)}</td>
      <td style="padding:6px 0;font-family:${FONT.body};font-size:15px;line-height:1.5;color:${EMAIL.warmWhite};vertical-align:top;">${esc(r.value)}</td>
    </tr>`,
    )
    .join('\n')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${cells}</table>`
}

/**
 * Tabla de líneas del pedido. Muestra el lente elegido debajo del nombre porque
 * el mismo modelo con dos lentes son dos líneas distintas: sin esa etiqueta el
 * comprador ve el producto repetido y escribe preguntando si le cobraron doble.
 */
export function itemsTable(lines: OrderLine[], totalCop: number): string {
  const rows = lines
    .map((l) => {
      const lens = l.lensOptionName
        ? `<div style="margin-top:4px;font-family:${FONT.body};font-size:13px;line-height:1.5;color:#8f8d87;">Lente: ${esc(l.lensOptionName)}${
            l.lensExtraPriceCop ? ` (+ ${esc(formatCop(l.lensExtraPriceCop))})` : ' (incluido)'
          }</div>`
        : ''
      const qty = l.quantity > 1 ? `<span style="color:#8f8d87;"> × ${l.quantity}</span>` : ''
      return `<tr>
      <td style="padding:14px 12px 14px 0;border-bottom:1px solid ${EMAIL.carbon700};font-family:${FONT.head};font-size:16px;line-height:1.4;color:${EMAIL.warmWhite};">${esc(l.productName)}${qty}${lens}</td>
      <td align="right" style="padding:14px 0;border-bottom:1px solid ${EMAIL.carbon700};font-family:${FONT.body};font-size:16px;line-height:1.4;color:${EMAIL.warmWhite};white-space:nowrap;vertical-align:top;">${esc(formatCop(l.unitPriceCop * l.quantity))}</td>
    </tr>`
    })
    .join('\n')

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
  ${rows}
  <tr>
    <td style="padding:16px 12px 0 0;font-family:${FONT.mono};font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${EMAIL.gold};">Total</td>
    <td align="right" style="padding:16px 0 0;font-family:${FONT.head};font-size:20px;font-weight:500;color:${EMAIL.warmWhite};white-space:nowrap;">${esc(formatCop(totalCop))}</td>
  </tr>
</table>`
}

/**
 * Foto de producto. Con ancho fijo y `max-width:100%` para que no reviente el
 * lienzo en móvil, y con alt: muchos clientes bloquean imágenes por defecto y
 * el alt es lo único que se ve.
 */
export function image(src: string, alt: string, width = 552): string {
  return `<img src="${escUrl(src)}" alt="${esc(alt)}" width="${width}" style="display:block;width:100%;max-width:${width}px;height:auto;border:0;outline:none;text-decoration:none;border-radius:4px;" />`
}

/** Bloque de texto que el comprador escribió (nota de fórmula, observaciones). */
export function quote(text: string): string {
  return `<div style="margin:0 0 20px;padding:14px 18px;border-left:2px solid ${EMAIL.gold};background-color:${EMAIL.carbon800};font-family:${FONT.mono};font-size:14px;line-height:1.6;color:${EMAIL.warmGray};white-space:pre-wrap;">${esc(text)}</div>`
}
