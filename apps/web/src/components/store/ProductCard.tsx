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
import { canBuy } from '../../lib/storeMode'

/** Tarjeta de producto para la rejilla de la tienda. Datos desde la DB (DTO). */
export function ProductCard({ product }: { product: ProductDTO }) {
  const { t, lang } = useDict()
  const cover = resolveProductSrc(product.images[0] ?? { key: '', url: null })
  const soldOut = product.stock <= 0
  // Tienda sin pagos abiertos: la rejilla lo dice desde la tarjeta para que
  // nadie entre a la ficha esperando un botón de comprar que no está.
  const preview = !canBuy()

  return (
    <motion.div variants={fadeUp} className="h-full">
      <Link
        href={`/tienda/${product.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-carbon-850 transition-transform duration-500 hover:-translate-y-1"
      >
        <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-carbon-900">
          <Image
            src={cover}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 380px, (min-width: 1024px) 30vw, 45vw"
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          {soldOut && (
            <span className="absolute left-2 top-2 rounded-full bg-carbon-900/85 px-3 py-1 font-mono text-[0.65rem] tracking-widest text-warm-gray/80 backdrop-blur sm:left-3 sm:top-3">
              {t.store.soldOut}
            </span>
          )}
          {!soldOut && preview && (
            <span className="absolute left-2 top-2 rounded-full border border-gold/50 bg-carbon-900/85 px-3 py-1 font-mono text-[0.65rem] tracking-widest text-gold backdrop-blur sm:left-3 sm:top-3">
              {t.store.preview.badge}
            </span>
          )}
          {!soldOut && !preview && hasDiscount(product) && (
            <span className="absolute left-2 top-2 rounded-full bg-gold px-2.5 py-1 font-mono text-[0.65rem] tracking-widest text-carbon-900 sm:left-3 sm:top-3">
              {fill(t.store.discountBadge, { pct: discountPct(product) })}
            </span>
          )}
        </div>
        {/* En móvil la rejilla es de 2 columnas y la tarjeta baja a ~160px:
            ahí solo caben foto, nombre y precio. El tagline se partiría en tres
            líneas y el renglón "ver detalle" es redundante —la tarjeta entera ya
            es el enlace—, así que ambos se ocultan por debajo de `sm`. */}
        <div className="flex flex-1 flex-col p-4 sm:p-6">
          <h3 className="font-head text-base text-warm-white sm:text-lg">{product.name}</h3>
          <p className="mt-1.5 hidden text-sm text-warm-gray/70 sm:line-clamp-2">
            {productTagline(product, lang)}
          </p>

          {/* Pie anclado abajo (`mt-auto`): precio y enlace quedan a la misma
              altura en toda la fila aunque el tagline ocupe una línea más.
              Precio y "ver detalle" van en renglones separados —compartiendo
              uno solo, el precio con descuento empujaba al enlace hasta
              partirlo en dos líneas y sacar la flecha fuera de la tarjeta. */}
          <div className="mt-auto pt-4 sm:pt-6">
            {/* `flex-wrap`: el precio tachado se va solo al renglón de abajo
                cuando no cabe al lado (justo lo que pasa a 2 columnas). */}
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="font-head text-base text-warm-white sm:text-lg">
                {formatCop(product.priceCop)}
              </span>
              {hasDiscount(product) && (
                <span className="text-xs text-warm-gray/45 line-through">
                  {formatCop(product.compareAtPriceCop!)}
                </span>
              )}
            </div>
            <span className="mt-4 hidden items-center justify-between border-t border-line pt-4 font-mono text-xs tracking-widest text-gold sm:flex">
              {t.store.viewDetail}
              <Icon
                name="arrow"
                size={14}
                className="transition-transform duration-500 ease-out group-hover:translate-x-1"
              />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
