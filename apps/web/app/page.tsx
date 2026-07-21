'use client'

import { Nav } from '../src/sections/Nav'
import { Hero } from '../src/sections/Hero'
import { WhatIsAxis } from '../src/sections/WhatIsAxis'
import { ProductShowcase } from '../src/sections/ProductShowcase'
import { Capabilities } from '../src/sections/Capabilities'
import { Specs } from '../src/sections/Specs'
import { Clinical } from '../src/sections/Clinical'
import { ShowcaseBanner } from '../src/sections/ShowcaseBanner'
import { Editions } from '../src/sections/Editions'
import { Lifestyle } from '../src/sections/Lifestyle'
import { TrustSignals } from '../src/sections/TrustSignals'
import { FaqCommercial } from '../src/sections/FaqCommercial'
import { ContactCommercial } from '../src/sections/ContactCommercial'
import { Footer } from '../src/sections/Footer'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <WhatIsAxis />
        <ProductShowcase />
        <Capabilities />
        <Specs />
        <Clinical />
        <ShowcaseBanner />
        <Editions />
        <Lifestyle />
        <TrustSignals />
        <FaqCommercial />
        <ContactCommercial />
      </main>
      <Footer />
    </>
  )
}
