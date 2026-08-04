'use client'

import { useSyncExternalStore } from 'react'

// Estado del menú móvil FUERA de React (mismo patrón que `cart.ts`).
//
// Por qué no es un `useState` dentro de <Nav>: el menú a pantalla completa y la
// <BuyBar> viven en ramas distintas del árbol (la barra la monta la landing,
// el menú lo monta el Nav) y ambos son `fixed` en la parte de abajo con el
// mismo z-index. Con el menú abierto se veían DOS botones "Comprar AXIS"
// solapados. La barra necesita saber si el menú está abierto para esconderse,
// y un contexto obligaría a envolver el layout entero para un solo booleano.

let open = false
const listeners = new Set<() => void>()

export function setMenuOpen(value: boolean) {
  if (value === open) return
  open = value
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Hook reactivo (SSR-safe: en servidor el menú siempre está cerrado). */
export function useMenuOpen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => open,
    () => false,
  )
}
