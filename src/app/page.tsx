import { HeroSection } from '@/components/landing/HeroSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { DemoPreview } from '@/components/landing/DemoPreview'
import { PricingSection } from '@/components/landing/PricingSection'
import { FAQSection } from '@/components/landing/FAQSection'
import { Footer } from '@/components/landing/Footer'
import { Navigation } from '@/components/navigation/Navigation'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main className="flex flex-col min-h-screen pt-16">
        <HeroSection />
        <FeaturesSection />
        <DemoPreview />
        <PricingSection />
        <FAQSection />
        <Footer />
      </main>
    </div>
  )
}