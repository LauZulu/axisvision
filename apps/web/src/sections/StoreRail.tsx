import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ProductCard } from '../components/store/ProductCard'
import { SectionHeading } from '../components/ui/SectionHeading'
import { TiltCard } from '../components/ui/TiltCard'
import { Icon } from '../components/ui/Icon'
import { useDict } from '../i18n/useDict'
import { inView, stagger } from '../lib/motion'
import type { ProductDTO } from '../lib/products'

/**
 * Vitrina de producto justo bajo el hero: los modelos reales (foto + precio)
 * a un scroll de la apertura. Carga desde /api/products en cliente para que la
 * landing siga siendo estática; si la DB no responde, la sección no aparece.
 * En mobile es un carrusel horizontal con snap; en desktop, rejilla de 4.
 */
export function StoreRail() {
  const { t } = useDict()
  const [products, setProducts] = useState<ProductDTO[] | null>(null)

  useEffect(() => {
    let alive = true
    fetch('/api/products')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        if (alive) setProducts(Array.isArray(d.products) ? d.products : [])
      })
      .catch(() => {
        if (alive) setProducts([])
      })
    return () => {
      alive = false
    }
  }, [])

  if (!products?.length) return null

  return (
    <section id="shop" className="border-t border-line py-24 md:py-32">
      <div className="container-axis">
        <SectionHeading
          eyebrow={t.storeRail.eyebrow}
          title={t.storeRail.title}
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-4"
        >
          {products.map((product) => (
            <TiltCard
              key={product.slug}
              className="w-[76vw] shrink-0 snap-center sm:w-auto sm:shrink"
            >
              <ProductCard product={product} />
            </TiltCard>
          ))}
        </motion.div>

        <div className="mt-10">
          <Link href="/tienda" className="btn-ghost">
            {t.storeRail.viewAll}
            <Icon name="arrow" size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}
