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
  },
  // TypeORM y el driver pg usan require dinámico / binarios: no los bundlees.
  serverExternalPackages: ['typeorm', 'pg', 'bcryptjs'],
}

export default nextConfig
