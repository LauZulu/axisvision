import type { NextConfig } from 'next'
import path from 'node:path'

const nextConfig: NextConfig = {
  // Raíz del monorepo (evita que Next infiera mal la raíz por lockfiles vecinos).
  outputFileTracingRoot: path.join(import.meta.dirname, '../../'),
  // React Compiler activo (equivale al reactCompilerPreset de Vite).
  // No añadir memoización manual: el compilador la gestiona.
  experimental: {
    reactCompiler: true,
  },
  // TypeORM y el driver pg usan require dinámico / binarios: no los bundlees.
  serverExternalPackages: ['typeorm', 'pg', 'bcryptjs'],
}

export default nextConfig
