import { useRef } from 'react'
import Link from 'next/link'
import { useReducedMotion, useScroll } from 'framer-motion'
import { TreeLogo } from '../components/ui/TreeLogo'
import { Icon } from '../components/ui/Icon'
import { Img } from '../components/ui/Img'
import { Reveal } from '../components/ui/Reveal'
import { Magnetic } from '../components/ui/Magnetic'
import { MorphoSheen } from '../components/ui/MorphoSheen'
import { gafasDeFrente as cierreImg } from '../lib/siteImages'
import { useDict } from '../i18n/useDict'
import { whatsappLink, ADDRESS, MAPS_URL, INSTAGRAM_HANDLE, INSTAGRAM_URL } from '../config/brand'

export function ContactCommercial() {
  const { t } = useDict()
  const reduce = useReducedMotion()

  // El sello se dibuja a medida que el usuario llega al cierre.
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] })

  return (
    <section
      ref={ref}
      id="contact"
      className="relative isolate overflow-hidden border-t border-line py-28 md:py-40"
    >
      {/* Foto de cierre a sangre. La heredó de la banda "Tuyas hoy" que se
          retiró: aquel bloque repetía este mismo mensaje y este mismo botón
          unas secciones antes, así que el momento de compra se cuenta una sola
          vez y se queda con la imagen. Decorativa (alt=""): el mensaje va en el
          titular. */}
      <div aria-hidden className="absolute inset-0 -z-20">
        <Img picture={cierreImg} alt="" fill sizes="100vw" className="object-cover object-center" />
      </div>
      <div aria-hidden className="closing-scrim absolute inset-0 -z-10" />

      {/* Sello árbol (dibujado por el scroll) + aura Morpho de fondo */}
      <TreeLogo
        progress={reduce ? undefined : scrollYProgress}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[160%] -translate-x-1/2 -translate-y-1/2 text-gold/[0.05]"
      />
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

        {/* CTA de conversión — tienda primero, asesoría por WhatsApp como apoyo */}
        <Reveal delay={0.2}>
          <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row">
            <Magnetic className="w-full sm:w-auto">
              <Link href="/tienda" className="btn-axis w-full sm:w-auto">
                {t.contact.ctaStore}
                <Icon name="arrow" size={18} />
                <MorphoSheen />
              </Link>
            </Magnetic>
            <a
              href={whatsappLink('general')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
            >
              <Icon name="whatsapp" size={18} />
              {t.contact.ctaWhatsapp}
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.26}>
          <p className="mt-7 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-warm-gray/45">
            {t.contact.note}
          </p>
        </Reveal>

        {/* Dónde estamos y dónde seguirnos: ambos enlaces salen del sitio, así
            que van después del CTA de compra, no compitiendo con él. */}
        <Reveal delay={0.3}>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 text-sm text-warm-gray/70 sm:flex-row sm:gap-8">
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 transition-colors hover:text-gold"
            >
              <Icon name="pin" size={16} />
              <span>
                <span className="text-warm-gray/45">{t.contact.visitUs} · </span>
                {ADDRESS}
              </span>
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 transition-colors hover:text-gold"
            >
              <Icon name="instagram" size={16} />
              <span>
                <span className="text-warm-gray/45">{t.contact.followUs} · </span>
                {INSTAGRAM_HANDLE}
              </span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
