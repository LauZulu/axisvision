import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { Img } from '../components/ui/Img'
import { heroProducto as productImg } from '../lib/siteImages'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Reveal } from '../components/ui/Reveal'
import { useDict } from '../i18n/useDict'

const FEATHER = 'radial-gradient(130% 130% at 50% 50%, #000 58%, transparent 100%)'

export function ProductShowcase() {
  const { t } = useDict()
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const rotate = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-6, 6])
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [50, -50])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], reduce ? [1, 1, 1] : [0.96, 1.02, 0.96])

  return (
    <section id="product" className="border-t border-line py-24 md:py-36">
      <div className="container-axis grid items-center gap-16 lg:grid-cols-2">
        <SectionHeading eyebrow={t.product.eyebrow} title={t.product.title} intro={t.product.intro} />

        <div ref={ref} className="relative">
          {/* Halo dorado tenue tras el producto */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(200,169,110,0.10),transparent_62%)]"
          />
          <motion.div
            style={{ rotate, y, scale, maskImage: FEATHER, WebkitMaskImage: FEATHER }}
            className="relative"
          >
            <Img
              picture={productImg}
              alt={t.alt.productShowcase}
              sizes="(min-width: 1024px) 46vw, 90vw"
              className="w-full drop-shadow-[0_30px_60px_rgba(0,0,0,0.5)]"
            />
          </motion.div>

          <ul className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6">
            {t.product.annotations.map((a, i) => (
              <Reveal as="li" key={a.label} delay={i * 0.06} className="border-t border-gold/25 pt-3">
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-gold">
                  {a.label}
                </span>
                <p className="mt-1 text-sm text-warm-gray/80">{a.value}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
