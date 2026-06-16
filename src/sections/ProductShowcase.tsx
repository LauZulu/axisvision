import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { GlassesArt } from '../components/ui/GlassesArt'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Reveal } from '../components/ui/Reveal'
import { useDict } from '../i18n/useDict'

export function ProductShowcase() {
  const { t } = useDict()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const rotate = useTransform(scrollYProgress, [0, 1], [-7, 7])
  const y = useTransform(scrollYProgress, [0, 1], [40, -40])

  return (
    <section id="product" className="border-t border-white/5 py-24 md:py-36">
      <div className="container-axis grid items-center gap-16 lg:grid-cols-2">
        <SectionHeading eyebrow={t.product.eyebrow} title={t.product.title} intro={t.product.intro} />

        <div ref={ref} className="relative">
          <motion.div style={{ rotate, y }} className="relative">
            <GlassesArt className="w-full drop-shadow-[0_30px_60px_rgba(0,0,0,0.5)]" glow={0.18} />
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
