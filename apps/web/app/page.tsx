'use client'

import { Nav } from '../src/sections/Nav'
import { Hero } from '../src/sections/Hero'
import { StoreRail } from '../src/sections/StoreRail'
import { WhatIsAxis } from '../src/sections/WhatIsAxis'
import { ProductShowcase } from '../src/sections/ProductShowcase'
import { Capabilities } from '../src/sections/Capabilities'
import { ShowcaseBanner } from '../src/sections/ShowcaseBanner'
import { Lifestyle } from '../src/sections/Lifestyle'
import { FaqCommercial } from '../src/sections/FaqCommercial'
import { ContactCommercial } from '../src/sections/ContactCommercial'
import { Footer } from '../src/sections/Footer'
import { BuyBar } from '../src/components/ui/BuyBar'

// Estructura orientada a conversión: hero → vitrina de compra (productos
// reales con precio) → manifiesto → producto → capacidades → momento de compra
// (banner) → prueba social → objeciones (FAQ) → cierre. Specs/Clinical/
// TrustSignals/Editions se retiraron: los modelos viven en la vitrina y la
// tienda; el resto quedó condensado en FAQ y señales de confianza.
//
// Cada capacidad de AXIS se cuenta UNA sola vez, en <Capabilities>. <WhatIsAxis>
// es solo el statement (su rejilla de pilares repetía esa lista) y
// <ProductShowcase> habla solo de materiales y hechura. Al añadir copy, comprobar
// que no vuelve a decirse lo mismo en dos secciones.
export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <StoreRail />
        <WhatIsAxis />
        <ProductShowcase />
        <Capabilities />
        <ShowcaseBanner />
        <Lifestyle />
        <FaqCommercial />
        <ContactCommercial />
      </main>
      <Footer />
      <BuyBar />
    </>
  )
}
