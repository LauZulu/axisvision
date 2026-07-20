import { TreeLogo } from '../components/ui/TreeLogo'
import { Icon } from '../components/ui/Icon'
import { Reveal } from '../components/ui/Reveal'
import { useDict } from '../i18n/useDict'
import { whatsappLink } from '../config/brand'

export function ContactCommercial() {
  const { t } = useDict()

  return (
    <section id="contact" className="relative overflow-hidden border-t border-line py-28 md:py-40">
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

        {/* CTA de conversión — WhatsApp */}
        <Reveal delay={0.2}>
          <div className="mt-10 flex justify-center">
            <a
              href={whatsappLink('general')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-axis w-full sm:w-auto"
            >
              <Icon name="whatsapp" size={20} />
              {t.contact.ctaWhatsapp}
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.26}>
          <p className="mt-7 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-warm-gray/45">
            {t.contact.note}
          </p>
        </Reveal>
      </div>
    </section>
  )
}
