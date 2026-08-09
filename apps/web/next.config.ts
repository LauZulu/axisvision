import type { NextConfig } from 'next'
import path from 'node:path'

// Permite a next/image cargar desde el dominio de CloudFront (si está configurado).
function cdnRemotePatterns() {
  const cdn = process.env.NEXT_PUBLIC_CDN_URL
  if (!cdn) return undefined
  try {
    const u = new URL(cdn)
    return [{ protocol: u.protocol.replace(':', '') as 'https' | 'http', hostname: u.hostname }]
  } catch {
    return undefined
  }
}

const nextConfig: NextConfig = {
  // Raíz del monorepo (evita que Next infiera mal la raíz por lockfiles vecinos).
  outputFileTracingRoot: path.join(import.meta.dirname, '../../'),
  images: {
    remotePatterns: cdnRemotePatterns(),
  },
  // React Compiler activo (equivale al reactCompilerPreset de Vite).
  // No añadir memoización manual: el compilador la gestiona.
  experimental: {
    reactCompiler: true,
    // NO minificar el código del servidor. TypeORM identifica cada entidad por
    // el NOMBRE DE LA CLASE (`EntityMetadata.name`), y el minificador renombra
    // las clases a una letra: en el bundle llegaba a haber NUEVE clases `h` en
    // el mismo chunk. Con dos entidades llamadas igual, el orden topológico de
    // `repo.save()` ve una arista de un nodo a sí mismo y revienta con
    // `TypeORMError: Cyclic dependency: "h"` — un 500 que SOLO pasa en el build
    // de producción (en dev no se minifica), y que dejó al admin sin poder
    // guardar productos. Es también la causa de la que salió el arreglo de
    // referenciar las relaciones por nombre de tabla en las entidades.
    // El servidor no se descarga en el navegador: no minificarlo no cuesta
    // rendimiento y encima deja trazas de error legibles.
    serverMinification: false,
  },
  // TypeORM y el driver pg usan require dinámico / binarios: no los bundlees.
  serverExternalPackages: ['typeorm', 'pg', 'bcryptjs'],
}

export default nextConfig
