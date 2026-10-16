import Link from 'next/link';
import { LegalLayout } from '../legal/LegalLayout';

export const DOC_LINKS = [
  { href: '/docs/how-answers-work', label: 'How answers work' },
  { href: '/docs/discovery', label: 'Discovery, online data and bulk edits' },
  { href: '/docs/plans', label: 'What each plan includes' },
  { href: '/docs/memory', label: 'Memory' },
  { href: '/docs/tokens', label: 'Fewer tokens, measured' },
  { href: '/docs/connectors', label: 'Connectors' },
  { href: '/docs/connect-assistant', label: 'Connect an AI assistant' },
  { href: '/guides', label: 'Guides' },
  { href: '/changelog', label: 'Changelog' },
] as const;

/** One layout for every docs page: the same nav, readable width, and a line back to the live demo. */
export function DocPage({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <LegalLayout title={title} eyebrow={false} showHeroUpdated={false} quietOperator subtitle={subtitle}>
      <nav aria-label="Docs" className="mb-8 flex flex-wrap gap-x-5 gap-y-2 border-b border-[#414141]/10 pb-4 text-sm dark:border-[#262626]">
        <Link href="/docs" className="font-medium text-[#0A0A0A] hover:underline">Docs</Link>
        {DOC_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="text-[#414141]/80 hover:text-[#0A0A0A] dark:text-[#BABABA]">{l.label}</Link>
        ))}
      </nav>
      <div className="max-w-2xl space-y-5 text-[15px] leading-relaxed text-[#383838] dark:text-[#DCDCDC] [&_h2]:mt-8 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-[#2D2D2D] dark:[&_h2]:text-[#EDEDED] [&_a]:text-[#0A0A0A] [&_a]:underline [&_a]:underline-offset-2 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
      <p className="mt-10 text-sm text-[#414141]/70 dark:text-[#BABABA]">
        Want to see it rather than read about it? <Link href="/demo" className="text-[#0A0A0A] underline underline-offset-2">Try the live demo</Link>, no account needed.
      </p>
    </LegalLayout>
  );
}
