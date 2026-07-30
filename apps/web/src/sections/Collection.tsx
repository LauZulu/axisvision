import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Reveal } from '../components/ui/Reveal'
import { useDict } from '../i18n/useDict'
import { useProducts } from '../lib/useProducts'
import { resolveProductSrc } from '../lib/productImages'
import { formatCop } from '../lib/products'
import { inViewSoon, settleScale } from '../lib/motion'
import type { Dict } from '../i18n'
import type { ProductDTO } from '../lib/products'

type CollectionKey = keyof Dict['collection']['products']

/** Orden del JSON de marca; el slug enlaza con el catálogo real de la DB. */
export const COLLECTION_ORDER: Array<{ key: CollectionKey; slug: string }> = [
  { key: 'origin', slug: 'axis-origin' },
  { key: 'crystal', slug: 'axis-crystal' },
  { key: 'shadow', slug: 'axis-shadow' },
  { key: 'ocean', slug: 'axis-ocean' },
  { key: 'apex', slug: 'axis-apex' },
  { key: 'eclipse', slug: 'axis-eclypse' },
]

// Retícula asimétrica (desktop): cada modelo ocupa un lugar distinto —
// ritmo de revista, no rejilla de tarjetas idénticas.
const PLACEMENTS = [
  { figure: 'md:col-span-6 md:col-start-1', aspect: 'aspect-[4/3]' },
  { figure: 'md:col-span-4 md:col-start-9 md:mt-28', aspect: 'aspect-[3/4]' },
  { figure: 'md:col-span-4 md:col-start-2 md:mt-10', aspect: 'aspect-[3/4]' },
  { figure: 'md:col-span-5 md:col-start-8 md:-mt-16', aspect: 'aspect-[4/5]' },
  { figure: 'md:col-span-4 md:col-start-1 md:mt-20', aspect: 'aspect-[3/4]' },
  { figure: 'md:col-span-6 md:col-start-6', aspect: 'aspect-[4/3]' },
]

/**
 * "Discover the Collection" — seis perspectivas. La copy viene del diccionario
 * (espejo del JSON de marca); la foto y el precio, del catálogo real. Si la API
 * no responde, queda la figura preparada y la palabra: la sección nunca se cae.
 */
export function Collection() {
  const { t } = useDict()
  const products = useProducts()

  const bySlug = new Map<string, ProductDTO>((products ?? []).map((p) => [p.slug, p]))

  return (
    <section id="collection" className="section-luxe" aria-label={t.collection.label}>
      <div className="container-axis">
        <header className="max-w-3xl">
          <Reveal>
            <p className="label-luxe">{t.collection.label}</p>
          </Reveal>
          <Reveal delay={0.15}>
            <h2 className="display-section mt-8">{t.collection.headline}</h2>
          </Reveal>
        </header>

        <div className="mt-24 grid grid-cols-12 gap-x-6 gap-y-24 md:mt-36">
          {COLLECTION_ORDER.map(({ key, slug }, i) => {
            const copy = t.collection.products[key]
            const product = bySlug.get(slug)
            const image = product?.images[0]
            const placement = PLACEMENTS[i]

            return (
              <article key={key} className={`col-span-12 ${placement.figure}`}>
                <Link href={`/tienda/${slug}`} className="group block">
                  <motion.figure
                    variants={settleScale}
                    initial="hidden"
                    whileInView="show"
                    viewport={inViewSoon}
                    className={`figure-luxe ${placement.aspect} overflow-hidden ${
                      image ? '' : 'figure-pending'
                    }`}
                  >
                    {image && (
                      <Image
                        src={resolveProductSrc(image)}
                        alt={`${t.alt.collection} ${copy.name}`}
                        width={1200}
                        height={1200}
                        sizes="(min-width: 768px) 45vw, 100vw"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </motion.figure>

                  <Reveal className="mt-7">
                    <h3 className="font-display text-3xl text-ink">{copy.name}</h3>
                    <p className="font-display mt-1 text-xl text-warm-gray/80 italic">
                      {copy.identity}
                    </p>
                    <p className="mt-4 max-w-[38ch] text-[0.95rem] leading-relaxed text-warm-gray/80">
                      {copy.description}
                    </p>
                    <div className="mt-5 flex items-baseline gap-6">
                      {product && (
                        <span className="font-mono text-[0.72rem] tracking-[0.14em] text-warm-gray/80">
                          {formatCop(product.priceCop)}
                        </span>
                      )}
                      <span className="link-luxe transition-colors duration-700 group-hover:text-bronze-deep">
                        {t.collection.discover}
                      </span>
                    </div>
                  </Reveal>
                </Link>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
