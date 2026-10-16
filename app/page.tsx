import { LandingExperience } from './Components/landing/LandingExperience';
import { HeroSection } from './Components/landing/HeroSection';
import { MemorySection } from './Components/landing/MemorySection';
import { LeaksSection } from './Components/landing/LeaksSection';
import { DescentSection } from './Components/landing/DescentSection';
import { CapabilitiesSection } from './Components/landing/CapabilitiesSection';
import { HowItWorksSection } from './Components/landing/HowItWorksSection';
import { ComparisonSection } from './Components/landing/ComparisonSection';
import { UseCasesSection } from './Components/landing/UseCasesSection';
import { PricingTeaserSection } from './Components/landing/PricingTeaserSection';
import { FAQSection } from './Components/landing/FAQSection';
import { ClosingCTASection } from './Components/landing/ClosingCTASection';
import { Footer } from './Components/landing/Footer';

export default function Home() {
  return (
    <LandingExperience>
      <main className="relative z-10">
        <HeroSection />
        <MemorySection />
        <LeaksSection />
        <DescentSection />
        <div className="relative z-10 bg-[#F8F8F8] dark:bg-[#121212] text-[#414141] dark:text-[#EDEDED] shadow-2xl transition-colors duration-500">
          <CapabilitiesSection />
          <HowItWorksSection />
          <ComparisonSection />
          <UseCasesSection />
          <PricingTeaserSection />
          <FAQSection />
          <div className="relative bg-transparent">
            <ClosingCTASection />
          </div>
          <Footer />
        </div>
      </main>
    </LandingExperience>
  );
}
