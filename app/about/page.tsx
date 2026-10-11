import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout, LegalSection } from '../Components/legal/LegalLayout';
import { EMAIL, LEGAL_NAME, REGISTERED_ADDRESS } from '../lib/legalEntity';

export const metadata: Metadata = {
  title: 'About — AnalyzeIt',
  description: 'AnalyzeIt is an independent analytics workspace built in India. Who runs it, what it is for, and how to reach us.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <LegalLayout
      title="About AnalyzeIt"
      eyebrow={false}
      showHeroUpdated={false}
      subtitle="An analytics workspace for people who have data but no data team."
    >
      <LegalSection title="What we are building">
        <p>
          Most small teams know their numbers live in several places and that something is off,
          but nobody has time to find out what. AnalyzeIt lets you ask in plain words, checks the
          numbers with fixed calculations before any language model writes a sentence, and shows
          the figures and sources behind every answer so you can verify them or hand them to
          someone else.
        </p>
      </LegalSection>

      <LegalSection title="How we work">
        <p>
          Numbers come from calculation, not from a model&apos;s guess. Connectors are read-only. We
          do not train public models on your private business data. Details are in our{' '}
          <Link href="/security" className="text-[#E3836C] hover:underline">security</Link> and{' '}
          <Link href="/privacy" className="text-[#E3836C] hover:underline">privacy</Link> pages,
          and in <Link href="/docs/how-answers-work" className="text-[#E3836C] hover:underline">how answers work</Link>.
        </p>
      </LegalSection>

      <LegalSection title="Who runs it">
        <p>
          AnalyzeIt is an independent product operated by {LEGAL_NAME}, {REGISTERED_ADDRESS}.
          Payments are processed by Razorpay; plans and prices are on the{' '}
          <Link href="/products" className="text-[#E3836C] hover:underline">products page</Link>.
        </p>
      </LegalSection>

      <LegalSection title="Talk to us">
        <p>
          Questions, feedback or a data source you want supported:{' '}
          <a href={`mailto:${EMAIL.support}`} className="text-[#E3836C] hover:underline">{EMAIL.support}</a>.
          Other inboxes are on the <Link href="/contact" className="text-[#E3836C] hover:underline">contact page</Link>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
