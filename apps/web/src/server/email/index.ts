/**
 * Correo transaccional de AXIS (Brevo).
 *
 * Punto de entrada único: quien envía importa de aquí, nunca de los archivos
 * sueltos de `templates/`.
 *
 * Las plantillas son funciones puras — `datos → { subject, preheader, html,
 * text }`. No leen la base de datos, no llaman a la API de Brevo y no dependen
 * de variables de entorno más allá de `NEXT_PUBLIC_SITE_URL`. Eso es lo que
 * permite verlas todas con `pnpm email:preview` sin cuenta, sin llaves y sin
 * mandar un solo correo.
 */
export * from './types'
export * from './templates'
export * from './brevo'
