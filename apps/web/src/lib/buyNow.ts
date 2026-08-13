'use client'

import type { Prescription } from './prescription'

/**
 * La fórmula de una compra por "Comprar ahora".
 *
 * Ese botón salta el carrito: manda al checkout con la selección en la URL
 * (`?item=&lens=&ar=&rx=1`). La graduación no cabe ahí — son diez números que
 * quedarían a la vista, se podrían editar a mano y ensuciarían cualquier
 * enlace que alguien copiara— así que viaja por `sessionStorage`, que es de
 * esta pestaña y desaparece al cerrarla.
 *
 * No sustituye a nada: el servidor revalida y recotiza la fórmula igual. Esto
 * solo evita que el cliente tenga que escribirla dos veces.
 */
const KEY = 'axis-buynow-rx'

export function stashBuyNowRx(rx: Prescription | null): void {
  try {
    if (rx) window.sessionStorage.setItem(KEY, JSON.stringify(rx))
    // Sin fórmula se BORRA la anterior: si no, una compra sin graduación
    // heredaría la del intento anterior de la misma sesión.
    else window.sessionStorage.removeItem(KEY)
  } catch {
    /* modo privado o almacenamiento lleno: el checkout la pedirá de nuevo */
  }
}

export function readBuyNowRx(): Prescription | null {
  try {
    const raw = window.sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Prescription) : null
  } catch {
    return null
  }
}
