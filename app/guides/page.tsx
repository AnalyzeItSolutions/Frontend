import type { Metadata } from 'next';
import Link from '../Components/pseo/Link';
import { LegalLayout } from '../Components/legal/LegalLayout';
import { GUIDES, readMinutes } from '../lib/guides.mjs';

export const metadata: Metadata = {
  title: 'Guides: analyze data without SQL, and trust the answers — AnalyzeIt',
  description: 'Plain guides: chat with your data, analyze it without SQL, find what changed, tell noise from change, check public data, clean a CSV and forecast.',
  alternates: { canonical: '/guides' },
};

export default function Page() {
  return (
    <LegalLayout title="Guides to working with data." eyebrow={false} showHeroUpdated={false} quietOperator subtitle="Short, practical guides on getting answers from numbers without fooling yourself.">
      <ul className="max-w-2xl space-y-6">
        {GUIDES.map((g) => (
          <li key={g.slug}>
            <Link href={`/guides/${g.slug}`} className="font-serif text-2xl text-[#2D2D2D] hover:text-[var(--text-primary)] dark:text-[#EDEDED]">
              {g.title}
            </Link>
            <p className="mt-1 text-[15px] text-[#414141]/85 dark:text-[#BABABA]">{g.description}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{readMinutes(g)} min read</p>
          </li>
        ))}
      </ul>
      <p className="mt-10 text-sm text-[var(--text-secondary)]">
        New to choosing software? Start with{' '}
        <Link href="/data-analysis-software" className="text-[var(--text-primary)] underline underline-offset-2">data analysis software: which kind fits your job</Link>.
      </p>
      <p className="mt-4 text-sm text-[var(--text-secondary)]">
        Prefer to see it work? <Link href="/demo" className="text-[var(--text-primary)] underline underline-offset-2">Try the live demo</Link> or browse the{' '}
        <Link href="/cases" className="text-[var(--text-primary)] underline underline-offset-2">worked examples</Link>. For formulas, see{' '}
        <Link href="/metrics" className="text-[var(--text-primary)] underline underline-offset-2">business metrics</Link> and{' '}
        <Link href="/methods" className="text-[var(--text-primary)] underline underline-offset-2">statistics methods</Link>.
      </p>
    </LegalLayout>
  );
}
