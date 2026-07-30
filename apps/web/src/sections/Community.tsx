import { Reveal } from '../components/ui/Reveal'
import { useDict } from '../i18n/useDict'

/**
 * "Community" — construido con quienes están dando forma al mañana.
 * Aún no existe fotografía real de eventos: se preparan figuras vacías
 * (espacio en negativo + etiqueta tipográfica) listas para recibirla,
 * en una retícula asimétrica que ya marca el ritmo final.
 */
export function Community() {
  const { t } = useDict()

  const placements = [
    'md:col-span-4 md:col-start-1 md:mt-16',
    'md:col-span-4 md:col-start-6',
    'md:col-span-3 md:col-start-10 md:mt-28',
  ]

  return (
    <section className="section-luxe" aria-label={t.community.label}>
      <div className="container-axis">
        <header className="max-w-4xl">
          <Reveal>
            <p className="label-luxe">{t.community.label}</p>
          </Reveal>
          <Reveal delay={0.15}>
            <h2 className="display-section mt-8">{t.community.headline}</h2>
          </Reveal>
        </header>

        <div className="mt-24 grid grid-cols-12 gap-x-6 gap-y-16">
          {t.community.scenes.map((scene, i) => (
            <Reveal as="div" key={scene} className={`col-span-12 sm:col-span-6 ${placements[i]}`}>
              <figure>
                <div className="figure-pending aspect-[4/5]">
                  <span className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-warm-gray/80">
                    {t.community.pending}
                  </span>
                </div>
                <figcaption className="font-display mt-5 text-lg text-warm-gray/80 italic">
                  {scene}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
