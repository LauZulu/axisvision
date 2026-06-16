import { useState } from 'react'
import { motion } from 'framer-motion'
import { TreeLogo } from '../components/ui/TreeLogo'
import { Icon } from '../components/ui/Icon'
import { Reveal } from '../components/ui/Reveal'
import { useDict } from '../i18n/useDict'
import { whatsappLink, CATALOG_URL, type BuyerType } from '../config/brand'

export function ContactCommercial() {
  const { t } = useDict()
  const [type, setType] = useState<BuyerType>('optica')

  return (
    <section id="contact" className="relative overflow-hidden border-t border-white/5 py-28 md:py-40">
      {/* Sello árbol + aura Morpho de fondo */}
      <TreeLogo className="pointer-events-none absolute left-1/2 top-1/2 h-[160%] -translate-x-1/2 -translate-y-1/2 text-gold/[0.05]" />
      <div
        aria-hidden
        className="bg-morpho pointer-events-none absolute bottom-[-20%] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full opacity-[0.14] blur-[130px]"
      />

      <div className="container-axis relative mx-auto max-w-2xl text-center">
        <Reveal>
          <span className="eyebrow">{t.contact.eyebrow}</span>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="font-display mt-5 text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.05] text-warm-white">
            {t.contact.title}
          </h2>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mx-auto mt-5 max-w-[48ch] text-lg text-warm-gray/80">{t.contact.body}</p>
        </Reveal>

        {/* Selector de tipo de comprador */}
        <Reveal delay={0.18}>
          <div className="mt-10">
            <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-warm-gray/55">
              {t.contact.typeLabel}
            </span>
            <div className="mt-3 inline-flex flex-wrap justify-center gap-2 rounded-full border border-white/10 p-1.5">
              {t.contact.types.map((opt) => {
                const isActive = opt.key === type
                return (
                  <button
                    key={opt.key}
                    onClick={() => setType(opt.key as BuyerType)}
                    className={`relative rounded-full px-5 py-2 font-head text-sm transition-colors ${
                      isActive ? 'text-carbon-900' : 'text-warm-gray/70 hover:text-warm-white'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="type-pill"
                        className="absolute inset-0 rounded-full bg-gold"
                        transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                      />
                    )}
                    <span className="relative">{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </Reveal>

        {/* CTAs de conversión */}
        <Reveal delay={0.24}>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={whatsappLink(type)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-axis w-full sm:w-auto"
            >
              <Icon name="whatsapp" size={20} />
              {t.contact.ctaWhatsapp}
            </a>
            <a href={CATALOG_URL} download className="btn-ghost">
              <Icon name="download" size={18} />
              {t.contact.ctaCatalog}
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.3}>
          <p className="mt-7 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-warm-gray/45">
            {t.contact.note}
          </p>
        </Reveal>
      </div>
    </section>
  )
}
