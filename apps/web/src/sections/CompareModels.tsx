import Image from 'next/image'
import Link from 'next/link'
import { Reveal } from '../components/ui/Reveal'
import { useDict } from '../i18n/useDict'
import { useProducts } from '../lib/useProducts'
import { resolveProductSrc } from '../lib/productImages'
import { formatCop } from '../lib/products'
import { COLLECTION_ORDER } from './Collection'
import type { ProductDTO } from '../lib/products'

/**
 * "Compare Models" — comparación mínima con fotografía, no con tablas:
 * los seis modelos a la misma escala, lado a lado, con lo esencial debajo.
 * En móvil es un carrete horizontal con snap; en desktop, seis columnas.
 */
export function CompareModels() {
  const { t } = useDict()
  const products = useProducts()
  const bySlug = new Map<string, ProductDTO>((products ?? []).map((p) => [p.slug, p]))

  return (
    <section className="section-luxe" aria-label={t.compare.label}>
      <div className="container-axis">
        <header className="max-w-3xl">
          <Reveal>
            <p className="label-luxe">{t.compare.label}</p>
          </Reveal>
          <Reveal delay={0.15}>
            <h2 className="display-section mt-8">{t.compare.headline}</h2>
          </Reveal>
        </header>

        <ul className="mt-20 flex snap-x snap-mandatory gap-8 overflow-x-auto pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-6 md:gap-6 md:overflow-visible md:pb-0">
          {COLLECTION_ORDER.map(({ key, slug }) => {
            const copy = t.collection.products[key]
            const product = bySlug.get(slug)
            const image = product?.images[0]

            return (
              <li key={key} className="w-[58vw] shrink-0 snap-center sm:w-[40vw] md:w-auto md:shrink">
                <Reveal>
                  <Link href={`/tienda/${slug}`} className="group block">
                    <figure
                      className={`figure-luxe aspect-square overflow-hidden ${
                        image ? '' : 'figure-pending'
                      }`}
                    >
                      {image && (
                        <Image
                          src={resolveProductSrc(image)}
                          alt={`${t.alt.collection} ${copy.name}`}
                          width={800}
                          height={800}
                          sizes="(min-width: 768px) 16vw, 58vw"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </figure>
                    <h3 className="font-display mt-6 text-xl text-ink">{copy.name}</h3>
                    <p className="font-display mt-0.5 text-base text-warm-gray/80 italic">
                      {copy.identity}
                    </p>
                    {product && (
                      <p className="mt-3 font-mono text-[0.68rem] tracking-[0.14em] text-warm-gray/80">
                        {formatCop(product.priceCop)}
                      </p>
                    )}
                    <p className="mt-4">
                      <span className="link-luxe transition-colors duration-700 group-hover:text-bronze-deep">
                        {t.compare.discover}
                      </span>
                    </p>
                  </Link>
                </Reveal>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
