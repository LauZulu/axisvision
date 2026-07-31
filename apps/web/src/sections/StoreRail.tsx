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
 * Rejilla en todos los tamaños: 2 columnas en móvil (3 filas) y 3 en desktop
 * (2 filas). Con 6 modelos ambas quedan simétricas y el catálogo entero se ve
 * de un vistazo — antes era un carrusel horizontal donde en móvil solo asomaba
 * un modelo y medio y había que adivinar que se deslizaba.
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
          className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3"
        >
          {products.map((product) => (
            <TiltCard key={product.slug} className="h-full">
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
