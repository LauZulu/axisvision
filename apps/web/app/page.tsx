'use client'

import { Nav } from '../src/sections/Nav'
import { Hero } from '../src/sections/Hero'
import { StoreRail } from '../src/sections/StoreRail'
import { ProductShowcase } from '../src/sections/ProductShowcase'
import { Capabilities } from '../src/sections/Capabilities'
import { Lifestyle } from '../src/sections/Lifestyle'
import { FaqCommercial } from '../src/sections/FaqCommercial'
import { ContactCommercial } from '../src/sections/ContactCommercial'
import { Footer } from '../src/sections/Footer'
import { BuyBar } from '../src/components/ui/BuyBar'

// Estructura orientada a conversión: hero → vitrina de compra (productos reales
// con precio) → producto → manifiesto + capacidades → prueba social →
// objeciones (FAQ) → cierre.
//
// Dos reglas que costó llegar a ellas, no deshacerlas sin pensarlo:
//
// 1. Cada capacidad de AXIS se cuenta UNA sola vez, en <Capabilities>. Hubo una
//    sección <WhatIsAxis> con cuatro pilares que ya estaban en esa lista (dos
//    con el mismo título); su statement se fusionó dentro de <Capabilities> y la
//    sección desapareció. <ProductShowcase> habla solo de materiales y hechura.
// 2. El momento de compra se cuenta UNA sola vez como sección, en
//    <ContactCommercial>. Hubo un <ShowcaseBanner> ("Tuyas hoy" + Comprar) que
//    repetía ese cierre y además caía pegado al CTA de <Capabilities>; su foto
//    pasó al cierre como fondo. Entre nav, hero, capacidades, cierre y <BuyBar>
//    ya hay llamadas a comprar de sobra: no añadir otra sección-CTA.
export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <StoreRail />
        <ProductShowcase />
        <Capabilities />
        <Lifestyle />
        <FaqCommercial />
        <ContactCommercial />
      </main>
      <Footer />
      <BuyBar />
    </>
  )
}
