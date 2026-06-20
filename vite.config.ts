import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { imagetools } from 'vite-imagetools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    // Pipeline responsive: cualquier imagen importada con `?picture` se genera
    // en AVIF + WebP + formato original, en varios anchos, con `srcset`.
    // Uso: import foto from '...jpg?picture'  ->  <Img picture={foto} ... />
    imagetools({
      defaultDirectives: (url) => {
        if (url.searchParams.has('picture')) {
          return new URLSearchParams({
            format: 'avif;webp;jpg',
            w: '480;768;1200;1920',
            as: 'picture',
          })
        }
        return new URLSearchParams()
      },
    }),
  ],
})
