import { Header } from "@/app/components/header"
import { Hero } from "@/app/components/hero"
import { Features } from "@/app/components/features"
import { HowItWorks } from "@/app/components/how-it-works"
import { Pricing } from "@/app/components/pricing"
import { Footer } from "@/app/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Footer />
    </main>
  )
}
