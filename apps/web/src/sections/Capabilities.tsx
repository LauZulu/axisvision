import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon, type IconKey } from '../components/ui/Icon'
import { TreeLogo } from '../components/ui/TreeLogo'
import { Img } from '../components/ui/Img'
import { empaqueAbierto as capabilitiesImg } from '../lib/siteImages'
import { SectionHeading } from '../components/ui/SectionHeading'
import { useDict } from '../i18n/useDict'
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

// Sección de "luz": colores fijos que NO siguen el tema (siempre clara).
export function Capabilities() {
  const { t } = useDict()
  const [active, setActive] = useState(0)
  const items = t.capabilities.items
  const current = items[active]

  return (
    <section id="capabilities" className="bg-[#f5f3ee] py-24 text-[#0a0a0a] md:py-36">
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
                    className={`group flex w-full items-center gap-4 border-b border-[#0a0a0a]/10 py-4 text-left transition-colors ${
                      isActive ? 'text-[#0a0a0a]' : 'text-[#0a0a0a]/45 hover:text-[#0a0a0a]/80'
                    }`}
                  >
                    <span
                      className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-colors ${
                        isActive
                          ? 'border-gold-deep/50 text-gold-deep'
                          : 'border-[#0a0a0a]/15 text-[#0a0a0a]/40'
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

          {/* Panel visual: banner de producto + info con crossfade (siempre oscuro) */}
          <div className="relative grid min-h-[440px] grid-rows-[auto_1fr] overflow-hidden rounded-2xl bg-[#0a0a0a]">
            {/* Banner de producto (foto real, fundida al panel) */}
            <div className="relative">
              <Img
                picture={capabilitiesImg}
                alt={t.alt.capabilities}
                sizes="(min-width: 1024px) 52vw, 90vw"
                className="aspect-[16/10] w-full object-cover object-center"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/25 to-transparent"
              />
            </div>

            {/* Info de la capacidad activa */}
            <div className="relative p-8 md:p-10">
              <div
                aria-hidden
                className="bg-morpho pointer-events-none absolute -right-16 -top-10 h-56 w-56 rounded-full opacity-25 blur-[90px]"
              />
              <TreeLogo className="pointer-events-none absolute bottom-[-12%] right-[-6%] h-[78%] text-gold/10" />

              <AnimatePresence mode="wait">
                <motion.div
                  key={current.key}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
                  className="relative flex flex-col"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-gold">
                      <Icon name={ICONS[current.key]} size={40} strokeWidth={1.3} />
                    </span>
                    <span className="eyebrow block">
                      {String(active + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="font-display mt-4 text-3xl text-[#f5f3ee] md:text-4xl">
                    {current.title}
                  </h3>
                  <p className="mt-3 max-w-[42ch] text-lg text-white/70">{current.desc}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <Link
            href="/tienda"
            className="btn-axis !border-[#0a0a0a]/30 !text-[#0a0a0a] hover:!text-[#f5f3ee]"
          >
            {t.capabilities.cta}
            <Icon name="arrow" size={18} />
          </Link>
        </div>
      </div>
    </section>
  )
}
