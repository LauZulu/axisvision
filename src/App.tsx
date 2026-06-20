import { SmoothScroll } from './lib/SmoothScroll'
import { Nav } from './sections/Nav'
import { Hero } from './sections/Hero'
import { WhatIsAxis } from './sections/WhatIsAxis'
import { ProductShowcase } from './sections/ProductShowcase'
import { Capabilities } from './sections/Capabilities'
import { Specs } from './sections/Specs'
import { Clinical } from './sections/Clinical'
import { BusinessOpportunity } from './sections/BusinessOpportunity'
import { PartnerProgram } from './sections/PartnerProgram'
import { TrustSignals } from './sections/TrustSignals'
import { ShowcaseBanner } from './sections/ShowcaseBanner'
import { Editions } from './sections/Editions'
import { Lifestyle } from './sections/Lifestyle'
import { ConsumerStrip } from './sections/ConsumerStrip'
import { FaqCommercial } from './sections/FaqCommercial'
import { ContactCommercial } from './sections/ContactCommercial'
import { Footer } from './sections/Footer'

function App() {
  return (
    <SmoothScroll>
      <Nav />
      <main>
        <Hero />
        <WhatIsAxis />
        <ProductShowcase />
        <Capabilities />
        <Specs />
        <Clinical />
        <BusinessOpportunity />
        <PartnerProgram />
        <TrustSignals />
        <ShowcaseBanner />
        <Editions />
        <Lifestyle />
        <ConsumerStrip />
        <FaqCommercial />
        <ContactCommercial />
      </main>
      <Footer />
    </SmoothScroll>
  )
}

export default App
