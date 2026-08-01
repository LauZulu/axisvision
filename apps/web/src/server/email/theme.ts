/**
 * Tokens de marca para correo. Réplica de los de `app/globals.css`, pero como
 * valores literales: en HTML de correo NO existen variables CSS ni `color-mix`
 * (Outlook/Gmail los ignoran), así que todo va inline y en hexadecimal.
 *
 * Regla de marca que se mantiene aquí: el dorado solo en líneas, etiquetas y
 * contornos — nunca como relleno grande. Por eso el botón principal es la
 * píldora con borde dorado del sitio, no un bloque dorado.
 */
export const EMAIL = {
  carbon900: '#0a0a0a',
  carbon850: '#0d0d0d',
  carbon800: '#141414',
  carbon700: '#1c1c1c',
  gold: '#c8a96e',
  goldDeep: '#8b6b35',
  warmWhite: '#f5f3ee',
  warmGray: '#d8d6cf',
  /** Iridiscencia Morpho — un solo destello por correo, como máximo. */
  morpho: '#2a5ada',
  /** Ancho del lienzo. 600px es el máximo seguro en Outlook de escritorio. */
  width: 600,
} as const

// Las fuentes de marca no se pueden cargar en correo (los clientes bloquean
// @font-face), así que cada familia declara su alternativa del sistema.
export const FONT = {
  head: "'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  body: "'DM Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  mono: "'DM Mono', 'Courier New', Courier, monospace",
  serif: "'Cormorant Garamond', Georgia, 'Times New Roman', serif",
} as const
