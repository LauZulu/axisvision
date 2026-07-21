import { motion } from 'framer-motion'
import { GlassesArt } from '../components/ui/GlassesArt'
import { Img } from '../components/ui/Img'
import packagingImg from '../assets/packaging/empaque-cerrado.jpeg'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Reveal } from '../components/ui/Reveal'
import { Icon } from '../components/ui/Icon'
import { useDict } from '../i18n/useDict'
import { useScrollTo } from '../lib/scrollContext'
import { fadeUp, inView, stagger } from '../lib/motion'

// Reflejo Morpho creciente por edición (Onyx → Aurum → Morpho)
const GLOW = [0.06, 0.14, 0.32]

export function Editions() {
  const { t } = useDict()
  const scrollTo = useScrollTo()
  return (
    <section id="editions" className="border-t border-line py-24 md:py-36">
      <div className="container-axis">
        <SectionHeading eyebrow={t.editions.eyebrow} title={t.editions.title} intro={t.editions.intro} />

        {/* Empaque premium — la experiencia de unboxing */}
        <Reveal className="mt-12">
          <div className="group relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-gold/20">
            <Img
              picture={packagingImg}
              alt={t.alt.packaging}
              sizes="(min-width: 768px) 768px, 92vw"
              className="aspect-[2/1] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          </div>
        </Reveal>

        <motion.ul
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="mt-14 grid gap-6 md:grid-cols-3"
        >
          {t.editions.finishes.map((f, i) => (
            <motion.li
              key={f.name}
              variants={fadeUp}
              className="group overflow-hidden rounded-2xl border border-line bg-carbon-850"
            >
              <div className="relative grid place-items-center bg-carbon-900 p-10 transition-transform duration-700 group-hover:scale-[1.02]">
                <GlassesArt className="w-full" glow={GLOW[i]} />
              </div>
              <div className="p-6">
                <h3 className="font-head text-lg text-warm-white">{f.name}</h3>
                <p className="mt-1.5 text-sm text-warm-gray/70">{f.desc}</p>
              </div>
            </motion.li>
          ))}
        </motion.ul>

        <div className="mt-12">
          <button onClick={() => scrollTo('#contact')} className="btn-axis">
            {t.editions.cta}
            <Icon name="arrow" size={18} />
          </button>
        </div>
      </div>
    </section>
  )
}
