import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { TreeLogo } from '../components/ui/TreeLogo'
import { useDict } from '../i18n/useDict'
import { useScrollTo } from '../lib/scrollContext'
import { whatsappLink, SALES_EMAIL } from '../config/brand'

/**
 * Pie mínimo — marca, tagline, tres anclas, contacto y legal. Separado por
 * espacio en blanco (sin filetes ni bordes), tipografía sobre lienzo.
 * Compartido con /tienda: las anclas navegan a /#seccion fuera del home.
 */
export function Footer() {
  const { t, lang, setLang } = useDict()
  const scrollTo = useScrollTo()
  const pathname = usePathname()
  const router = useRouter()

  const go = (sel: string) => {
    if (pathname !== '/') {
      router.push('/' + sel)
      return
    }
    scrollTo(sel)
  }

  const anchors: Array<[string, string]> = [
    ['#collection', t.nav.collection],
    ['#craftsmanship', t.nav.craftsmanship],
    ['#founder', t.nav.founder],
  ]

  return (
    <footer className="pt-32 pb-14 md:pt-44">
      <div className="container-axis">
        <div className="grid grid-cols-12 gap-x-6 gap-y-16">
          <div className="col-span-12 md:col-span-6">
            <div className="flex items-center gap-2.5 text-ink">
              <TreeLogo className="h-7 w-auto" strokeWidth={5} />
              <span className="font-head text-sm tracking-[0.32em]">AXIS</span>
            </div>
            <p className="font-display mt-7 max-w-[24ch] text-2xl text-ink">{t.footer.tagline}</p>
          </div>

          <nav className="col-span-6 md:col-span-3" aria-label={t.footer.colExplore}>
            <h3 className="label-luxe">{t.footer.colExplore}</h3>
            <ul className="mt-6 flex flex-col gap-3.5 text-sm">
              {anchors.map(([href, label]) => (
                <li key={href}>
                  <button
                    onClick={() => go(href)}
                    className="text-warm-gray/75 transition-colors duration-700 hover:text-bronze-deep"
                  >
                    {label}
                  </button>
                </li>
              ))}
              <li>
                <Link
                  href="/tienda"
                  className="text-warm-gray/75 transition-colors duration-700 hover:text-bronze-deep"
                >
                  {t.nav.store}
                </Link>
              </li>
            </ul>
          </nav>

          <div className="col-span-6 md:col-span-3">
            <h3 className="label-luxe">{t.footer.colContact}</h3>
            <ul className="mt-6 flex flex-col gap-3.5 text-sm">
              <li>
                <a
                  href={whatsappLink('general')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-warm-gray/75 transition-colors duration-700 hover:text-bronze-deep"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${SALES_EMAIL}`}
                  className="text-warm-gray/75 transition-colors duration-700 hover:text-bronze-deep"
                >
                  {SALES_EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-24 flex flex-col items-start justify-between gap-4 text-xs text-warm-gray/75 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {t.footer.rights} · {t.footer.registered}
          </p>
          <div className="font-mono tracking-[0.18em]">
            <button
              onClick={() => setLang('es')}
              aria-pressed={lang === 'es'}
              className={
                lang === 'es'
                  ? 'text-bronze-deep underline underline-offset-4'
                  : 'hover:text-warm-gray'
              }
            >
              ES
            </button>
            <span className="mx-1 text-warm-gray/40">/</span>
            <button
              onClick={() => setLang('en')}
              aria-pressed={lang === 'en'}
              className={
                lang === 'en'
                  ? 'text-bronze-deep underline underline-offset-4'
                  : 'hover:text-warm-gray'
              }
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
