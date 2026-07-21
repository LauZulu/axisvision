'use client'

import { motion } from 'framer-motion'
import { ProductCard } from './ProductCard'
import { SectionHeading } from '../ui/SectionHeading'
import { useDict } from '../../i18n/useDict'
import { inView, stagger } from '../../lib/motion'
import type { ProductDTO } from '../../lib/products'

/** Rejilla de la tienda (cliente): encabezado i18n + tarjetas desde la DB. */
export function StoreGrid({ products }: { products: ProductDTO[] }) {
  const { t } = useDict()

  return (
    <section className="py-20 md:py-28">
      <div className="container-axis">
        <span className="eyebrow inline-flex items-center gap-2 rounded-full border border-gold/25 px-3 py-1 text-gold">
          {t.store.testBadge}
        </span>

        <div className="mt-6">
          <SectionHeading eyebrow={t.store.eyebrow} title={t.store.title} intro={t.store.intro} />
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
