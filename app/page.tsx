import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from './lib/site';
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

// The home page leads with the search phrase people use; the brand tagline stays in the hero.
const HOME_TITLE = 'AI data analytics tool you can check — AnalyzeIt';
const HOME_DESCRIPTION =
  'Ask your business data in plain language and check every number: the source and the working are shown. Five free runs, no account needed.';

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
  twitter: { title: HOME_TITLE, description: HOME_DESCRIPTION },
};

export default function Home() {
  return (
    <LandingExperience>
      <main className="relative z-10">
        <HeroSection />
        <MemorySection />
        <LeaksSection />
        <DescentSection />
        <div className="relative z-10 bg-[#F8F8F8] dark:bg-[#1B1B1B] text-[#414141] dark:text-[#EDEDED] shadow-2xl transition-colors duration-500">
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
