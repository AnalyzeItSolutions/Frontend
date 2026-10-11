import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout, LegalSection } from '../Components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Features — AnalyzeIt',
  description: 'What AnalyzeIt does: plain-language questions, checked calculations, connectors, dashboards, forecasts and shown sources.',
  alternates: { canonical: '/features' },
};

const link = 'text-[#E3836C] hover:underline';

export default function FeaturesPage() {
  return (
    <LegalLayout
      title="What AnalyzeIt does"
      eyebrow={false}
      showHeroUpdated={false}
      subtitle="Ask a question, get an answer with the numbers and sources behind it."
    >
      <LegalSection title="Ask in plain words">
        <p>
          Type a question the way you would ask a colleague. Simple calculations, exchange rates,
          weather and stock prices are resolved by tools directly, not generated, and are labelled
          that way. See <Link href="/docs/how-answers-work" className={link}>how answers work</Link>.
        </p>
      </LegalSection>

      <LegalSection title="Find what changed, and why">
        <p>
          Statistics run before the language model does: period-over-period change, whether a move
          is bigger than your normal noise, and which segments drove it. The model explains
          results; it does not invent them.
        </p>
      </LegalSection>

      <LegalSection title="Connect your data">
        <p>
          Read-only connectors pull live data from sources such as Stripe, GitHub, Salesforce and
          SQL databases, plus public catalogs like Kaggle, Hugging Face and OpenML. AnalyzeIt
          displays and analyzes; it does not change your source systems. See{' '}
          <Link href="/docs/connectors" className={link}>connectors</Link> and{' '}
          <Link href="/docs/discovery" className={link}>public data discovery</Link>.
        </p>
      </LegalSection>

      <LegalSection title="Dashboards and forecasts">
        <p>
          Turn answers into dashboards you can keep and share by link, and forecast with a range
          that has been tested against your own history rather than a single confident line.
        </p>
      </LegalSection>

      <LegalSection title="Memory across sessions">
        <p>
          Your workspace keeps history so questions like "since when?" and "compared with last
          quarter" stay answerable. See <Link href="/docs/memory" className={link}>memory</Link>.
        </p>
      </LegalSection>

      <LegalSection title="Try it">
        <p>
          <Link href="/demo" className={link}>See a live demo</Link>, browse{' '}
          <Link href="/cases" className={link}>worked examples</Link>, or{' '}
          <Link href="/login" className={link}>start free</Link>. Plans are on the{' '}
          <Link href="/products" className={link}>products page</Link>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
