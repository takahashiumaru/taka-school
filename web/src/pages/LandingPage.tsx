import Header from "../components/Header"
import Footer from "../components/Footer"
import FloatingWA from "../components/FloatingWA"
import Hero from "../components/sections/Hero"
import Problem from "../components/sections/Problem"
import Features from "../components/sections/Features"
import Audience from "../components/sections/Audience"
import HowItWorks from "../components/sections/HowItWorks"
import Pricing from "../components/sections/Pricing"
import Testimonials from "../components/sections/Testimonials"
import FAQ from "../components/sections/FAQ"
import CTA from "../components/sections/CTA"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <Problem />
        <Features />
        <Audience />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
      <FloatingWA />
    </div>
  )
}
