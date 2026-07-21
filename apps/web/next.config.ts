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
  // Fase 3: al añadir TypeORM se declara aquí para no bundlearlo:
  // serverExternalPackages: ['typeorm'],
}

export default nextConfig
