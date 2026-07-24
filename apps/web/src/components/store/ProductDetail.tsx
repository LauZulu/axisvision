'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ImageCarousel, type Slide } from '../ui/ImageCarousel'
import { Icon } from '../ui/Icon'
import { useDict } from '../../i18n/useDict'
import { fill } from '../../lib/format'
import { resolveProductSrc } from '../../lib/productImages'
import {
  discountPct,
  formatCop,
  hasDiscount,
  productDescription,
  productTagline,
  type ProductDTO,
} from '../../lib/products'
import { addToCart } from '../../lib/cart'
import { whatsappLink } from '../../config/brand'

/** Detalle de producto (cliente). Datos desde la DB (DTO). */
export function ProductDetail({ product }: { product: ProductDTO }) {
  const { t, lang } = useDict()
  const router = useRouter()
  const soldOut = product.stock <= 0
  const maxQty = Math.max(1, Math.min(product.stock, 20))
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const slides: Slide[] = product.images.map((img) => ({
    src: resolveProductSrc(img),
    alt: product.name,
  }))
  const reserveMsg = t.store.reserveMessage.replace('{model}', product.name)

  function cartItem() {
    const cover = product.images[0] ?? { key: '', url: null }
    return {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      priceCop: product.priceCop,
      image: { key: cover.key, url: cover.url },
    }
  }

  function onBuyNow() {
    router.push(`/tienda/checkout?item=${encodeURIComponent(product.slug)}&qty=${qty}`)
  }

  function onAddToCart() {
    addToCart(cartItem(), qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <section className="py-14 md:py-20">
      <div className="container-axis">
        <Link
          href="/tienda"
          className="inline-flex items-center gap-2 font-mono text-xs tracking-widest text-warm-gray/70 transition-colors hover:text-gold"
        >
          <Icon name="arrow" size={14} className="rotate-180" />
          {t.store.back}
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <ImageCarousel
            slides={slides}
            fit="cover"
            sizes="(min-width: 1024px) 48vw, 92vw"
            className="aspect-[4/5] w-full overflow-hidden rounded-2xl border border-line bg-carbon-900"
          />

          <div className="lg:pt-4">
            <span className="eyebrow text-gold">{t.store.eyebrow}</span>
            <h1 className="mt-4 font-head text-3xl leading-tight font-medium text-warm-white md:text-4xl">
              {product.name}
            </h1>
            <p className="mt-3 text-lg text-warm-gray/80">{productTagline(product, lang)}</p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="font-head text-2xl text-warm-white">{formatCop(product.priceCop)}</span>
              {hasDiscount(product) && (
                <>
                  <span className="text-sm text-warm-gray/45 line-through">
                    {formatCop(product.compareAtPriceCop!)}
                  </span>
                  <span className="rounded-full bg-gold px-2.5 py-1 font-mono text-[0.65rem] tracking-widest text-carbon-900">
                    {fill(t.store.discountBadge, { pct: discountPct(product) })}
                  </span>
                </>
              )}
              {soldOut && (
                <span className="rounded-full border border-line px-3 py-1 font-mono text-[0.65rem] tracking-widest text-warm-gray/70">
                  {t.store.soldOut}
                </span>
              )}
            </div>

            <p className="mt-6 leading-relaxed text-warm-gray/80">
              {productDescription(product, lang)}
            </p>

            {!soldOut && (
              <div className="mt-8 flex items-center gap-4">
                <span className="text-sm text-warm-gray/70">{t.store.quantity}</span>
                <div className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    aria-label="−1"
                    className="grid h-9 w-9 place-items-center rounded-md border border-line text-warm-gray/80 transition-colors hover:border-gold/50 hover:text-gold disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-mono text-warm-white">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                    disabled={qty >= maxQty}
                    aria-label="+1"
                    className="grid h-9 w-9 place-items-center rounded-md border border-line text-warm-gray/80 transition-colors hover:border-gold/50 hover:text-gold disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {!soldOut && (
                <>
                  <button type="button" onClick={onBuyNow} className="btn-axis">
                    {t.store.buyNow}
                    <Icon name="arrow" size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={onAddToCart}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-gold/40 px-6 py-[0.95rem] font-head text-sm font-medium text-warm-white transition-colors hover:border-gold hover:text-gold"
                  >
                    <Icon name="bag" size={17} />
                    {added ? t.store.addedToCart : t.store.addToCart}
                  </button>
                </>
              )}
            </div>

            <a
              href={whatsappLink('general', reserveMsg)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm text-warm-gray/60 transition-colors hover:text-gold"
            >
              <Icon name="whatsapp" size={16} />
              {t.store.reserve}
            </a>

            <div className="mt-9">
              <h2 className="eyebrow text-gold">{t.store.includesTitle}</h2>
              <ul className="mt-4 space-y-2.5">
                {t.store.includes.map((item) => (
                  <li key={item} className="flex gap-3 text-warm-gray/85">
                    <Icon name="check" size={18} className="mt-0.5 shrink-0 text-gold" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
