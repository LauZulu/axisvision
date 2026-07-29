'use client'

import { useSyncExternalStore } from 'react'

// Carrito de invitado en localStorage ('axis-cart'). Guarda SOLO identidad y
// cantidad + datos de presentación; los PRECIOS reales los calcula el servidor
// desde la DB al crear la orden (lo del carrito es informativo).
//
// La línea se identifica por producto + LENTE elegido: el mismo modelo con dos
// lentes distintos son dos líneas separadas (`lineId`).
export type CartItem = {
  productId: string
  slug: string
  name: string
  /** Precio unitario mostrado = producto + extra del lente. */
  priceCop: number
  quantity: number
  image: { key: string; url: string | null }
  /** Lente elegido. null = el de fábrica (o catálogo de lentes no disponible). */
  lens: { id: string; name: string; extraPriceCop: number } | null
  /** Fórmula médica cuando el lente la exige. */
  prescriptionNote?: string | null
}

const STORAGE_KEY = 'axis-cart'
const MAX_QTY = 20

/** Identidad de una línea del carrito: producto + lente. */
export function lineId(item: Pick<CartItem, 'productId' | 'lens'>): string {
  return `${item.productId}::${item.lens?.id ?? 'default'}`
}

let items: CartItem[] = []
let loaded = false
const listeners = new Set<() => void>()

function load() {
  if (loaded || typeof window === 'undefined') return
  loaded = true
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : []
    if (Array.isArray(parsed)) {
      // `lens` no existía en la versión anterior del carrito: se normaliza a null
      // para no romper a quien tenga un carrito viejo guardado.
      items = parsed
        .filter((i) => i && i.productId && i.quantity > 0)
        .map((i) => ({ ...i, lens: i.lens ?? null }))
    }
  } catch {
    items = []
  }
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* almacenamiento lleno/bloqueado: el carrito sigue en memoria */
  }
}

function emit() {
  persist()
  for (const l of listeners) l()
}

export function getCart(): CartItem[] {
  load()
  return items
}

export function addToCart(item: Omit<CartItem, 'quantity'>, quantity = 1) {
  load()
  const id = lineId(item)
  const existing = items.find((i) => lineId(i) === id)
  if (existing) {
    items = items.map((i) =>
      lineId(i) === id ? { ...i, quantity: Math.min(i.quantity + quantity, MAX_QTY) } : i,
    )
  } else {
    items = [...items, { ...item, quantity: Math.min(quantity, MAX_QTY) }]
  }
  emit()
}

export function setCartQuantity(id: string, quantity: number) {
  load()
  const q = Math.max(0, Math.min(Math.floor(quantity) || 0, MAX_QTY))
  items =
    q === 0
      ? items.filter((i) => lineId(i) !== id)
      : items.map((i) => (lineId(i) === id ? { ...i, quantity: q } : i))
  emit()
}

export function removeFromCart(id: string) {
  load()
  items = items.filter((i) => lineId(i) !== id)
  emit()
}

/** Actualiza la fórmula médica de una línea (se pide en el checkout). */
export function setPrescription(id: string, note: string) {
  load()
  items = items.map((i) => (lineId(i) === id ? { ...i, prescriptionNote: note } : i))
  emit()
}

export function clearCart() {
  items = []
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const EMPTY: CartItem[] = []

/** Hook reactivo del carrito (SSR-safe: en servidor devuelve vacío). */
export function useCart(): CartItem[] {
  return useSyncExternalStore(
    subscribe,
    () => {
      load()
      return items
    },
    () => EMPTY,
  )
}

export const cartCount = (list: CartItem[]) => list.reduce((n, i) => n + i.quantity, 0)
export const cartTotalCop = (list: CartItem[]) =>
  list.reduce((n, i) => n + i.priceCop * i.quantity, 0)
