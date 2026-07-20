import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SectionHeading } from '../components/ui/SectionHeading'
import { useDict } from '../i18n/useDict'
import { EASE_OUT_EXPO } from '../lib/motion'

export function FaqCommercial() {
  const { t } = useDict()
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="border-t border-line py-24 md:py-36">
      <div className="container-axis grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading eyebrow={t.faq.eyebrow} title={t.faq.title} />

        <ul className="flex flex-col">
          {t.faq.items.map((item, i) => {
            const isOpen = open === i
            return (
              <li key={item.q} className="border-b border-line">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left"
                >
                  <span className="font-head text-base text-warm-white md:text-lg">{item.q}</span>
                  <span
                    className={`shrink-0 text-gold transition-transform duration-300 ${
                      isOpen ? 'rotate-45' : ''
                    }`}
                    aria-hidden
                  >
                    +
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-[60ch] pb-5 text-warm-gray/75">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
