import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Fuentes (self-host) — ruta híbrida del PLAN-AXIS.md §7.2
import '@fontsource-variable/inter-tight/wght.css'
import '@fontsource-variable/dm-sans/wght.css'
import '@fontsource/cormorant-garamond/400.css'
import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/dm-mono/400.css'
import '@fontsource/dm-mono/500.css'

import './index.css'
import './i18n'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
