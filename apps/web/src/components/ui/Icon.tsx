import type { JSX } from 'react'

/** Familia de iconos de línea fina (trazo dorado por currentColor). 24×24, sin relleno. */
const PATHS: Record<string, JSX.Element> = {
  // Capacidades
  video: (
    <>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="M16 10l5-3v10l-5-3" />
    </>
  ),
  photo: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <circle cx="12" cy="13.5" r="3.2" />
      <path d="M8 7l1.5-3h5L16 7" />
    </>
  ),
  ai: (
    <>
      <circle cx="12" cy="12" r="2.2" />
      <path d="M12 9.8V4.5M9.6 13.4 5.5 16.5M14.4 13.4 18.5 16.5" />
      <circle cx="12" cy="4.5" r="1.4" />
      <circle cx="5.5" cy="16.5" r="1.4" />
      <circle cx="18.5" cy="16.5" r="1.4" />
    </>
  ),
  translate: (
    <>
      <path d="M4 6h9M8 4.2V6M6.2 6c0 4-1.8 6.2-3 7.4M7.4 9.4c1 1.8 2.8 3 4.2 3.4" />
      <path d="M13 20l4-9 4 9M14.4 17h5.2" />
    </>
  ),
  audio: (
    <>
      <path d="M4 9.5v5h3l4.5 3.5v-12L7 9.5H4z" />
      <path d="M15 9.5c1.1 1.6 1.1 3.9 0 5.5M17.6 7.4c2.2 3 2.2 6.7 0 9.7" />
    </>
  ),
  lens: (
    <>
      <circle cx="7" cy="14" r="3.4" />
      <circle cx="17" cy="14" r="3.4" />
      <path d="M10.4 13.4c1-.9 2.2-.9 3.2 0M3.6 13 5.2 8.2H7M20.4 13 18.8 8.2H17" />
    </>
  ),
  battery: (
    <>
      <rect x="3" y="8" width="16" height="9" rx="2" />
      <path d="M21 11v3M6.5 11v3M9.5 11v3" />
    </>
  ),
  privacy: (
    <>
      <path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" />
      <circle cx="12" cy="11" r="1.6" />
      <path d="M12 12.6V15" />
    </>
  ),
  connectivity: (
    <>
      <path d="M12 4v16M12 4l5 4.5-10 7M12 20l5-4.5-10-7" />
    </>
  ),
  design: (
    <>
      <path d="M12 3l8 6-8 12L4 9z" />
      <path d="M4 9h16M9 3l3 6 3-6" />
    </>
  ),

  // Confianza / negocio
  warranty: (
    <>
      <path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" />
      <path d="M9 11.5l2 2 4-4.5" />
    </>
  ),
  registered: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 16V8H13a2.5 2.5 0 0 1 0 5H9.5m3.5 0 2 3" />
    </>
  ),
  clinical: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M5 12h3l2-4 3 8 2-4h2" />
    </>
  ),
  support: (
    <>
      <path d="M5 13v-1a7 7 0 0 1 14 0v1" />
      <rect x="3.5" y="13" width="3.5" height="6" rx="1.2" />
      <rect x="17" y="13" width="3.5" height="6" rx="1.2" />
      <path d="M19 19a4 4 0 0 1-4 3h-2" />
    </>
  ),
  supply: (
    <>
      <path d="M3 7l9-4 9 4-9 4-9-4z" />
      <path d="M3 7v8l9 4 9-4V7M12 11v8" />
    </>
  ),
  continuity: (
    <>
      <path d="M3 16c4 0 4-9 8-9s4 9 8 9" />
      <path d="M16 5.5h4v4" />
    </>
  ),

  // Negocio
  margin: (
    <>
      <path d="M3 16l5-5 4 4 8-8" />
      <path d="M16 7h5v5" />
    </>
  ),
  demand: (
    <>
      <path d="M4 19h16" />
      <rect x="5" y="11" width="3" height="6" />
      <rect x="10.5" y="7" width="3" height="10" />
      <rect x="16" y="4" width="3" height="13" />
    </>
  ),
  norisk: (
    <>
      <rect x="4" y="6" width="16" height="14" rx="2" />
      <path d="M8 11l2.5 2.5L16 8" />
    </>
  ),
  display: (
    <>
      <rect x="4" y="4" width="16" height="11" rx="1.5" />
      <path d="M12 15v4M8 19h8" />
    </>
  ),
  territory: (
    <>
      <path d="M12 21c5-5 7-8 7-11a7 7 0 1 0-14 0c0 3 2 6 7 11z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  brand: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8l1.3 2.6 2.9.4-2.1 2 .5 2.9L12 15l-2.6 1.4.5-2.9-2.1-2 2.9-.4z" />
    </>
  ),

  // Utilidad
  check: <path d="M4 12l5 5L20 6" />,
  arrow: <path d="M4 12h15M13 6l6 6-6 6" />,
  whatsapp: (
    <path d="M4 20l1.3-4A8 8 0 1 1 9 19.5L4 20zM9 9c0 4 3 6 6 6 .6 0 1.2-1 1.2-1.4 0-.3-1.6-1.2-1.9-1.2-.3 0-.6.6-.9.6-.6 0-2.4-1.6-2.4-2.2 0-.3.6-.6.6-.9 0-.3-.9-1.9-1.2-1.9C10.5 6.8 9 7.4 9 9z" />
  ),
  download: <path d="M12 4v10m0 0l-4-4m4 4l4-4M5 19h14" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  bag: (
    <>
      <path d="M5.5 8h13l-1 12h-11l-1-12z" />
      <path d="M9 10V6.5a3 3 0 0 1 6 0V10" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l.8 13h9.4l.8-13" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
}

export type IconKey = keyof typeof PATHS

type Props = {
  name: IconKey
  className?: string
  strokeWidth?: number
  size?: number
}

export function Icon({ name, className, strokeWidth = 1.5, size = 24 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  )
}
