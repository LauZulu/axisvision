import type { Metadata, Viewport } from 'next'

// Fuentes (self-host) — ruta híbrida del PLAN-AXIS.md §7.2
import '@fontsource-variable/inter-tight/wght.css'
import '@fontsource-variable/dm-sans/wght.css'
import '@fontsource/cormorant-garamond/400.css'
import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/dm-mono/400.css'
import '@fontsource/dm-mono/500.css'

import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  metadataBase: new URL('https://axisvision.co'),
  title: 'AXIS Vision — Gafas con inteligencia artificial',
  description:
    'AXIS Vision: gafas con inteligencia artificial. Vídeo, foto, traducción en vivo y lentes con tu fórmula. Reserva las tuyas por WhatsApp.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    type: 'website',
    title: 'AXIS Vision — Una nueva forma de ver el mundo',
    description:
      'Gafas con inteligencia artificial, hechas para llevarse puestas todo el día. Reserva las tuyas.',
    images: ['/og-image.jpg'],
    locale: 'es_ES',
    alternateLocale: ['en_US'],
  },
  twitter: { card: 'summary_large_image' },
}

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
}

// Script anti-FOUC: aplica el tema guardado ANTES del render para evitar parpadeo.
const themeScript = `(function () {
  try {
    var t = localStorage.getItem('axis-theme')
    if (t === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
      var m = document.querySelector('meta[name="theme-color"]')
      if (m) m.setAttribute('content', '#f5f3ee')
    }
  } catch (e) {}
})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
