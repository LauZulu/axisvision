import type { MetadataRoute } from 'next'

/**
 * El árbol del pie enlaza a /admin desde TODAS las páginas públicas, así que sin
 * esto Googlebot seguiría el enlace y acabaría indexando la pantalla de login.
 * El resto del sitio queda igual de rastreable que antes (no había robots.txt).
 * No es una medida de seguridad — el guardia real es `middleware.ts`.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api'],
    },
  }
}
