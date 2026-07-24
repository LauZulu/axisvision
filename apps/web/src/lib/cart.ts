'use client'

import { useSyncExternalStore } from 'react'

// Carrito de invitado en localStorage ('axis-cart'). Guarda SOLO identidad y
// cantidad + datos de presentación; los PRECIOS reales los calcula el servidor
// desde la DB al crear la orden (lo del carrito es informativo).
export type CartItem = {
  productId: string
  slug: string
  name: string
  priceCop: number
  quantity: number
  image: { key: string; url: string | null }
}

const STORAGE_KEY = 'axis-cart'
const MAX_QTY = 20

let items: CartItem[] = []
let loaded = false
const listeners = new Set<() => void>()

function load() {
  if (loaded || typeof window === 'undefined') return
  loaded = true
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : []
    if (Array.isArray(parsed)) items = parsed.filter((i) => i && i.productId && i.quantity > 0)
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
  const existing = items.find((i) => i.productId === item.productId)
  if (existing) {
    items = items.map((i) =>
      i.productId === item.productId
        ? { ...i, quantity: Math.min(i.quantity + quantity, MAX_QTY) }
        : i,
    )
  } else {
    items = [...items, { ...item, quantity: Math.min(quantity, MAX_QTY) }]
  }
  emit()
}

export function setCartQuantity(productId: string, quantity: number) {
  load()
  const q = Math.max(0, Math.min(Math.floor(quantity) || 0, MAX_QTY))
  items = q === 0
    ? items.filter((i) => i.productId !== productId)
    : items.map((i) => (i.productId === productId ? { ...i, quantity: q } : i))
  emit()
}

export function removeFromCart(productId: string) {
  load()
  items = items.filter((i) => i.productId !== productId)
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
export const cartTotalCop = (list: CartItem[]) => list.reduce((n, i) => n + i.priceCop * i.quantity, 0)
