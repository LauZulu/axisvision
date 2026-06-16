import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon, type IconKey } from '../components/ui/Icon'
import { TreeLogo } from '../components/ui/TreeLogo'
import { SectionHeading } from '../components/ui/SectionHeading'
import { useDict } from '../i18n/useDict'
import { whatsappLink } from '../config/brand'
import { EASE_OUT_EXPO } from '../lib/motion'

const ICONS: Record<string, IconKey> = {
  video: 'video',
  photo: 'photo',
  ai: 'ai',
  translate: 'translate',
  audio: 'audio',
  lens: 'lens',
  battery: 'battery',
  privacy: 'privacy',
}

export function Capabilities() {
  const { t } = useDict()
  const [active, setActive] = useState(0)
  const items = t.capabilities.items
  const current = items[active]

  return (
    <section id="capabilities" className="bg-warm-white py-24 text-carbon-900 md:py-36">
      <div className="container-axis">
        <SectionHeading
          light
          eyebrow={t.capabilities.eyebrow}
          title={t.capabilities.title}
          intro={t.capabilities.intro}
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
          {/* Lista de capacidades seleccionables */}
          <ul className="flex flex-col">
            {items.map((it, i) => {
              const isActive = i === active
              return (
                <li key={it.key}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => setActive(i)}
                    aria-pressed={isActive}
                    className={`group flex w-full items-center gap-4 border-b border-carbon-900/10 py-4 text-left transition-colors ${
                      isActive ? 'text-carbon-900' : 'text-carbon-900/45 hover:text-carbon-900/80'
                    }`}
                  >
                    <span
                      className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-colors ${
                        isActive
                          ? 'border-gold-deep/50 text-gold-deep'
                          : 'border-carbon-900/15 text-carbon-900/40'
                      }`}
                    >
                      <Icon name={ICONS[it.key]} size={20} strokeWidth={1.5} />
                      {isActive && (
                        <motion.span
                          layoutId="cap-ring"
                          className="absolute inset-0 rounded-full ring-1 ring-gold-deep/60"
                        />
                      )}
                    </span>
                    <span className="font-head text-base font-medium md:text-lg">{it.title}</span>
                  </button>
                </li>
              )
            })}
          </ul>

          {/* Panel visual con crossfade */}
          <div className="relative min-h-[360px] overflow-hidden rounded-2xl bg-carbon-900 p-8 md:p-12">
            <div
              aria-hidden
              className="bg-morpho pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-25 blur-[90px]"
            />
            <TreeLogo className="pointer-events-none absolute bottom-[-10%] right-[-6%] h-[80%] text-gold/10" />

            <AnimatePresence mode="wait">
              <motion.div
                key={current.key}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
                className="relative flex h-full flex-col"
              >
                <span className="text-gold">
                  <Icon name={ICONS[current.key]} size={56} strokeWidth={1.2} />
                </span>
                <span className="eyebrow mt-8 block">
                  {String(active + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
                </span>
                <h3 className="font-display mt-3 text-3xl text-warm-white md:text-4xl">
                  {current.title}
                </h3>
                <p className="mt-4 max-w-[42ch] text-lg text-warm-gray/80">{current.desc}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-12">
          <a
            href={whatsappLink('general')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-axis !border-carbon-900/30 !text-carbon-900 hover:!text-warm-white"
          >
            {t.capabilities.cta}
            <Icon name="arrow" size={18} />
          </a>
        </div>
      </div>
    </section>
  )
}
