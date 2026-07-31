import { Reveal } from '../components/ui/Reveal'
import { useDict } from '../i18n/useDict'

/**
 * Momento de manifiesto entre la vitrina y el producto: una sola frase que dice
 * qué es AXIS y deja respirar la página.
 *
 * Antes llevaba debajo una rejilla de cuatro pilares. Se quitó porque los
 * cuatro estaban ya en la sección de Capacidades —"Lentes con tu fórmula" con
 * el mismo título, y la traducción con la misma frase— y porque el statement
 * de arriba enumera esos mismos cuatro ("ven, escuchan, traducen y se
 * gradúan"): las tarjetas repetían la línea que tenían justo encima.
 */
export function WhatIsAxis() {
  const { t } = useDict()
  return (
    <section id="what" className="border-t border-line py-24 md:py-36">
      <div className="container-axis">
        <Reveal className="text-center">
          <span className="eyebrow">{t.what.eyebrow}</span>
        </Reveal>
        <Reveal delay={0.06}>
          <p className="font-display mx-auto mt-6 max-w-[20ch] text-center text-[clamp(1.8rem,4vw,3rem)] leading-[1.12] text-warm-white md:max-w-[26ch]">
            {t.what.statement}
          </p>
        </Reveal>
      </div>
    </section>
  )
}
