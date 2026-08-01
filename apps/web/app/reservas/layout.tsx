'use client'

import { Nav } from '../../src/sections/Nav'
import { Footer } from '../../src/sections/Footer'

/** Mismo marco que la tienda: a estas páginas se llega desde un correo. */
export default function ReservasLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="min-h-screen pt-16 md:pt-[72px]">{children}</main>
      <Footer />
    </>
  )
}
