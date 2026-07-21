'use client'

import { Nav } from '../../src/sections/Nav'
import { Footer } from '../../src/sections/Footer'

/** Layout de la tienda: Nav fija + contenido con offset + Footer (reutiliza los de la landing). */
export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="min-h-screen pt-16 md:pt-[72px]">{children}</main>
      <Footer />
    </>
  )
}
