'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Icon } from '../ui/Icon'
import { useDict } from '../../i18n/useDict'
import { formatCop } from '../../lib/products'
import { resolveProductSrc } from '../../lib/productImages'
import { useCart, setCartQuantity, removeFromCart, cartTotalCop, lineId } from '../../lib/cart'
import { canBuy } from '../../lib/storeMode'

/** Carrito (localStorage). Los precios finales los recalcula el servidor al pagar. */
export function CartView() {
  const { t } = useDict()
  const items = useCart()

  if (items.length === 0) {
    return (
      <section className="py-28 md:py-36">
        <div className="container-axis text-center">
          <Icon name="bag" size={40} className="mx-auto text-warm-gray/30" />
          <h1 className="mt-5 font-head text-2xl text-warm-white">{t.cart.title}</h1>
          <p className="mt-3 text-warm-gray/60">{t.cart.empty}</p>
          <Link href="/tienda" className="btn-axis mt-8 inline-flex">
            {t.cart.emptyCta}
          </Link>
        </div>
      </section>
    )
  }

  const total = cartTotalCop(items)

  return (
    <section className="py-16 md:py-24">
      <div className="container-axis max-w-4xl">
        <h1 className="font-head text-2xl text-warm-white md:text-3xl">{t.cart.title}</h1>

        <ul className="mt-8 divide-y divide-line/60 rounded-2xl border border-line bg-carbon-850">
          {items.map((item) => (
            <li key={lineId(item)} className="flex items-center gap-4 p-4 sm:p-5">
              <Link
                href={`/tienda/${item.slug}`}
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line bg-carbon-900"
              >
                <Image
                  src={resolveProductSrc(item.image)}
                  alt={item.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </Link>

              <div className="min-w-0 flex-1">
                <Link href={`/tienda/${item.slug}`} className="font-head text-warm-white hover:text-gold">
                  {item.name}
                </Link>
                {item.lens && (
                  <div className="mt-0.5 font-mono text-[0.7rem] tracking-wide text-gold/75">
                    {item.lens.name}
                  </div>
                )}
                <div className="mt-1 text-sm text-warm-gray/60">{formatCop(item.priceCop)}</div>

                <div className="mt-2.5 inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCartQuantity(lineId(item), item.quantity - 1)}
                    aria-label="−1"
                    className="grid h-7 w-7 place-items-center rounded-md border border-line text-sm text-warm-gray/80 transition-colors hover:border-gold/50 hover:text-gold"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-mono text-sm text-warm-white">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => setCartQuantity(lineId(item), item.quantity + 1)}
                    aria-label="+1"
                    className="grid h-7 w-7 place-items-center rounded-md border border-line text-sm text-warm-gray/80 transition-colors hover:border-gold/50 hover:text-gold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className="font-head text-warm-white">
                  {formatCop(item.priceCop * item.quantity)}
                </span>
                <button
                  type="button"
                  onClick={() => removeFromCart(lineId(item))}
                  aria-label={t.cart.remove}
                  className="text-warm-gray/45 transition-colors hover:text-red-400"
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="text-sm text-warm-gray/60">{t.cart.total}</span>
              <span className="font-head text-2xl text-warm-white">{formatCop(total)}</span>
            </div>
            <p className="mt-1 text-xs text-warm-gray/45">{t.cart.note}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/tienda"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-line px-6 py-[0.95rem] font-head text-sm text-warm-gray/80 transition-colors hover:border-gold/50 hover:text-gold"
            >
              {t.cart.continueShopping}
            </Link>
            {canBuy() && (
              <Link href="/tienda/checkout" className="btn-axis">
                {t.cart.checkout}
                <Icon name="arrow" size={18} />
              </Link>
            )}
          </div>
        </div>

        {/* El carrito se conserva con la tienda cerrada: cuando abramos, sigue
            ahí. Lo que desaparece es el camino a un pago que no existe. */}
        {!canBuy() && (
          <div className="mt-6 rounded-xl border border-gold/40 bg-carbon-800/60 p-5">
            <p className="font-head text-warm-white">{t.store.preview.cartTitle}</p>
            <p className="mt-2 text-sm leading-relaxed text-warm-gray/75">
              {t.store.preview.cartBody}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
