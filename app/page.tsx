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
import { FAQS } from './lib/homeFaqs';
import { ClosingCTASection } from './Components/landing/ClosingCTASection';
import { Footer } from './Components/landing/Footer';

// The home page leads with the search phrase people use; the brand tagline stays in the hero.
const HOME_TITLE = 'AI Data Analysis Tool That Shows Its Working | AnalyzeIt';
const HOME_DESCRIPTION =
  'Ask your business data questions in plain English. AnalyzeIt runs the maths in code and shows the source, query and working. Five free runs, no account.';

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: { canonical: '/' },
  category: 'Data analytics software',
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

// Answer engines and AI search read the FAQ as question/answer pairs; the same text is visible on the page.
const homeJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: HOME_TITLE,
      description: HOME_DESCRIPTION,
      inLanguage: 'en',
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: { '@id': `${SITE_URL}/#software` },
      speakable: { '@type': 'SpeakableSpecification', cssSelector: ['#hero h1', '#hero-card p', '#faq summary'] },
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/#faq`,
      mainEntity: FAQS.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    },
  ],
};

export default function Home() {
  return (
    <LandingExperience>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />
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
