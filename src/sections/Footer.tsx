import { TreeLogo } from '../components/ui/TreeLogo'
import { useDict } from '../i18n/useDict'
import { useScrollTo } from '../lib/scrollContext'
import { whatsappLink, SALES_EMAIL } from '../config/brand'

export function Footer() {
  const { t, lang, setLang } = useDict()
  const scrollTo = useScrollTo()

  const productAnchors = ['#capabilities', '#product', '#editions']
  const businessAnchors = ['#business', '#program', '#faq']

  return (
    <footer className="border-t border-white/8 py-16">
      <div className="container-axis">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5 text-gold">
              <TreeLogo className="h-8 w-auto" />
              <span className="font-head text-sm tracking-[0.28em] text-warm-white">AXIS</span>
            </div>
            <p className="font-display mt-5 max-w-[28ch] text-xl text-warm-gray/80">
              {t.footer.tagline}
            </p>
          </div>

          <FooterCol
            title={t.footer.colProduct}
            links={t.footer.linksProduct.map((l, i) => ({ label: l, href: productAnchors[i] }))}
            onClick={scrollTo}
          />
          <FooterCol
            title={t.footer.colBusiness}
            links={t.footer.linksBusiness.map((l, i) => ({ label: l, href: businessAnchors[i] }))}
            onClick={scrollTo}
          />

          <div>
            <h4 className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-gold">
              {t.footer.colContact}
            </h4>
            <ul className="mt-4 flex flex-col gap-3 text-sm">
              <li>
                <a
                  href={whatsappLink('general')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-warm-gray/75 transition-colors hover:text-gold"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${SALES_EMAIL}`}
                  className="text-warm-gray/75 transition-colors hover:text-gold"
                >
                  {SALES_EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/8 pt-7 text-xs text-warm-gray/50 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {t.footer.rights} · {t.footer.registered}
          </p>
          <div className="font-mono tracking-widest">
            <button
              onClick={() => setLang('es')}
              className={lang === 'es' ? 'text-gold' : 'hover:text-warm-gray'}
            >
              ES
            </button>
            <span className="mx-1 text-warm-gray/30">/</span>
            <button
              onClick={() => setLang('en')}
              className={lang === 'en' ? 'text-gold' : 'hover:text-warm-gray'}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({
  title,
  links,
  onClick,
}: {
  title: string
  links: Array<{ label: string; href: string }>
  onClick: (sel: string) => void
}) {
  return (
    <div>
      <h4 className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-gold">{title}</h4>
      <ul className="mt-4 flex flex-col gap-3 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            <button
              onClick={() => onClick(l.href)}
              className="text-left text-warm-gray/75 transition-colors hover:text-gold"
            >
              {l.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
