'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Icon } from '../ui/Icon'
import { useDict } from '../../i18n/useDict'
import { fadeUp } from '../../lib/motion'
import { fill } from '../../lib/format'
import { resolveProductSrc } from '../../lib/productImages'
import { discountPct, formatCop, hasDiscount, productTagline, type ProductDTO } from '../../lib/products'

/** Tarjeta de producto para la rejilla de la tienda. Datos desde la DB (DTO). */
export function ProductCard({ product }: { product: ProductDTO }) {
  const { t, lang } = useDict()
  const cover = resolveProductSrc(product.images[0] ?? { key: '', url: null })
  const soldOut = product.stock <= 0

  return (
    <motion.div variants={fadeUp}>
      <Link
        href={`/tienda/${product.slug}`}
        className="group block overflow-hidden rounded-2xl border border-line bg-carbon-850 transition-transform duration-500 hover:-translate-y-1"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-carbon-900">
          <Image
            src={cover}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          {soldOut && (
            <span className="absolute left-3 top-3 rounded-full bg-carbon-900/85 px-3 py-1 font-mono text-[0.65rem] tracking-widest text-warm-gray/80 backdrop-blur">
              {t.store.soldOut}
            </span>
          )}
          {!soldOut && hasDiscount(product) && (
            <span className="absolute left-3 top-3 rounded-full bg-gold px-2.5 py-1 font-mono text-[0.65rem] tracking-widest text-ink">
              {fill(t.store.discountBadge, { pct: discountPct(product) })}
            </span>
          )}
        </div>
        <div className="p-6">
          <h3 className="font-head text-lg text-warm-white">{product.name}</h3>
          <p className="mt-1.5 line-clamp-2 text-sm text-warm-gray/70">
            {productTagline(product, lang)}
          </p>
          <div className="mt-5 flex items-baseline justify-between">
            <span className="flex items-baseline gap-2">
              <span className="font-head text-warm-white">{formatCop(product.priceCop)}</span>
              {hasDiscount(product) && (
                <span className="text-xs text-warm-gray/45 line-through">
                  {formatCop(product.compareAtPriceCop!)}
                </span>
              )}
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-xs tracking-widest text-gold transition-transform group-hover:translate-x-0.5">
              {t.store.viewDetail}
              <Icon name="arrow" size={14} />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
