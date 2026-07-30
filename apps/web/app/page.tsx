'use client'

import { Nav } from '../src/sections/Nav'
import { Hero } from '../src/sections/Hero'
import { FutureIsWorn } from '../src/sections/FutureIsWorn'
import { ExperienceAxis } from '../src/sections/ExperienceAxis'
import { HumanStories } from '../src/sections/HumanStories'
import { Collection } from '../src/sections/Collection'
import { CompareModels } from '../src/sections/CompareModels'
import { Craftsmanship } from '../src/sections/Craftsmanship'
import { Community } from '../src/sections/Community'
import { FounderEdition } from '../src/sections/FounderEdition'
import { FinalCta } from '../src/sections/FinalCta'
import { Footer } from '../src/sections/Footer'

// Mapa 1:1 con `website_sections` del JSON de marca: Hero → The Future is
// Worn → Experience AXIS → Human Stories → Discover the Collection →
// Compare Models → Craftsmanship → Community → Founder Edition → Final CTA.
// Cada scroll responde una pregunta y abre otra (Curiosity Loop); el énfasis
// se concentra al final (Peak-End).
export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <FutureIsWorn />
        <ExperienceAxis />
        <HumanStories />
        <Collection />
        <CompareModels />
        <Craftsmanship />
        <Community />
        <FounderEdition />
        <FinalCta />
      </main>
      <Footer />
    </>
  )
}
