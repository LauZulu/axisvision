import { Reveal } from '../components/ui/Reveal'
import { Icon } from '../components/ui/Icon'
import { useDict } from '../i18n/useDict'
import { whatsappLink } from '../config/brand'

/** Franja B2C — deliberadamente secundaria. Funciona como prueba de demanda. */
export function ConsumerStrip() {
  const { t } = useDict()
  return (
    <section id="consumer" className="border-t border-white/5 py-16 md:py-20">
      <div className="container-axis">
        <Reveal className="flex flex-col items-start gap-6 rounded-2xl border border-white/8 bg-carbon-850/60 p-8 md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <span className="eyebrow">{t.consumer.eyebrow}</span>
            <h3 className="font-head mt-3 max-w-[28ch] text-xl text-warm-white md:text-2xl">
              {t.consumer.title}
            </h3>
            <p className="mt-2 max-w-[52ch] text-warm-gray/70">{t.consumer.body}</p>
          </div>
          <a
            href={whatsappLink('b2c')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost shrink-0"
          >
            {t.consumer.cta}
            <Icon name="arrow" size={18} />
          </a>
        </Reveal>
      </div>
    </section>
  )
}
