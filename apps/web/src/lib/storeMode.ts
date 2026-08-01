/**
 * Modo de la tienda: ¿se puede comprar, o solo reservar?
 *
 * Existe porque el sitio sale a producción ANTES de que Wompi esté configurado.
 * Sin este interruptor, el botón "Comprar" llevaría a un checkout que revienta
 * — y una pasarela rota en la primera visita cuesta más que no tener tienda.
 *
 *   NEXT_PUBLIC_STORE_MODE=live      → se puede comprar
 *   NEXT_PUBLIC_STORE_MODE=preview   → solo reservar (dejar el correo)
 *   (sin definir)                    → PREVIEW
 *
 * El valor por defecto es deliberado: si la variable falta, está mal escrita o
 * alguien la borró del panel de despliegue, la tienda se queda en modo reserva.
 * El error seguro es no cobrar; el peligroso es cobrar sin pasarela.
 *
 * Este módulo es PURO (sin imports de servidor) para poder usarlo en
 * componentes cliente. La verdad de verdad la tiene `src/server/storeMode.ts`:
 * el cliente decide qué botón pinta, el servidor decide si acepta la compra.
 *
 * Ojo con Next: `process.env.NEXT_PUBLIC_*` se reemplaza en tiempo de BUILD,
 * así que hay que escribir la referencia completa y literal (nada de
 * `process.env[nombre]`), y cambiar la variable exige volver a construir.
 */
export type StoreMode = 'live' | 'preview'

/** Modo declarado por el entorno. Cualquier cosa que no sea 'live' es preview. */
export function storeMode(): StoreMode {
  return process.env.NEXT_PUBLIC_STORE_MODE === 'live' ? 'live' : 'preview'
}

/** ¿La tienda acepta compras? */
export function canBuy(): boolean {
  return storeMode() === 'live'
}

/** ¿Estamos en modo vitrina (catálogo visible, compra cerrada)? */
export function isPreview(): boolean {
  return !canBuy()
}
