import type { Metadata, Viewport } from 'next'

// Fuentes (self-host) — ruta híbrida: serif editorial + sans estructural
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
  title: 'AXIS — Inteligencia humana. Amplificada.',
  description:
    'AXIS: gafas con inteligencia artificial de lujo. La interfaz más natural entre las personas y la IA. Producción limitada — reserva las tuyas.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    type: 'website',
    title: 'AXIS — Human Intelligence. Amplified.',
    description:
      'Luxury AI eyewear designed to become the most natural interface between humans and artificial intelligence.',
    images: ['/og-image.jpg'],
    locale: 'es_ES',
    alternateLocale: ['en_US'],
  },
  twitter: { card: 'summary_large_image' },
}

export const viewport: Viewport = {
  themeColor: '#F7F3EC',
}

// Un solo tema de luz (#F7F3EC): sin data-theme ni script anti-FOUC.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
