'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ImageCarousel, type Slide } from '../../../src/components/ui/ImageCarousel'
import { Icon } from '../../../src/components/ui/Icon'
import { useDict } from '../../../src/i18n/useDict'
import { getProduct, formatCop } from '../../../src/config/catalog'
import { whatsappLink } from '../../../src/config/brand'

export default function ProductDetailPage() {
  const { t } = useDict()
  const params = useParams<{ slug: string }>()
  const slug = String(params.slug)
  const product = getProduct(slug)

  // Producto inexistente → estado vacío elegante con vuelta a la tienda.
  if (!product) {
    return (
      <section className="py-28 md:py-36">
        <div className="container-axis text-center">
          <h1 className="font-head text-2xl text-warm-white md:text-3xl">{t.store.notFoundTitle}</h1>
          <p className="mx-auto mt-4 max-w-md text-warm-gray/70">{t.store.notFoundBody}</p>
          <Link href="/tienda" className="btn-axis mt-8 inline-flex">
            {t.store.back}
          </Link>
        </div>
      </section>
    )
  }

  const p = t.store.products[product.key]
  const slides: Slide[] = product.images.map((pic) => ({ pic, alt: p.name }))
  const reserveMsg = t.store.reserveMessage.replace('{model}', p.name)

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
          {/* Galería */}
          <ImageCarousel
            slides={slides}
            fit="cover"
            sizes="(min-width: 1024px) 48vw, 92vw"
            className="aspect-[4/5] w-full overflow-hidden rounded-2xl border border-line bg-carbon-900"
          />

          {/* Información */}
          <div className="lg:pt-4">
            <span className="eyebrow text-gold">{t.store.eyebrow}</span>
            <h1 className="mt-4 font-head text-3xl leading-tight font-medium text-warm-white md:text-4xl">
              {p.name}
            </h1>
            <p className="mt-3 text-lg text-warm-gray/80">{p.tagline}</p>

            <div className="mt-6 font-head text-2xl text-warm-white">{formatCop(product.priceCop)}</div>

            <p className="mt-6 leading-relaxed text-warm-gray/80">{p.desc}</p>

            {/* Incluye */}
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

            {/* CTAs */}
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappLink('general', reserveMsg)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-axis"
              >
                <Icon name="whatsapp" size={18} />
                {t.store.reserve}
              </a>
              <button
                type="button"
                disabled
                title={t.store.soon}
                className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-md border border-line px-6 py-[0.95rem] font-head text-sm font-medium text-warm-gray/45"
              >
                {t.store.buy}
                <span className="font-mono text-[0.65rem] tracking-widest text-gold/70">
                  · {t.store.soon}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
