'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Img } from '../ui/Img'
import { Icon } from '../ui/Icon'
import { useDict } from '../../i18n/useDict'
import { formatCop, type Product } from '../../config/catalog'
import { fadeUp } from '../../lib/motion'

/** Tarjeta de producto para la rejilla de la tienda. Enlaza al detalle. */
export function ProductCard({ product }: { product: Product }) {
  const { t } = useDict()
  const p = t.store.products[product.key]

  return (
    <motion.div variants={fadeUp}>
      <Link
        href={`/tienda/${product.slug}`}
        className="group block overflow-hidden rounded-2xl border border-line bg-carbon-850 transition-transform duration-500 hover:-translate-y-1"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-carbon-900">
          <Img
            picture={product.images[0]}
            alt={p.name}
            sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        </div>
        <div className="p-6">
          <h3 className="font-head text-lg text-warm-white">{p.name}</h3>
          <p className="mt-1.5 line-clamp-2 text-sm text-warm-gray/70">{p.tagline}</p>
          <div className="mt-5 flex items-baseline justify-between">
            <span className="font-head text-warm-white">{formatCop(product.priceCop)}</span>
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
