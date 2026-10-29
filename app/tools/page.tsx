import type { Metadata } from 'next';
import Link from '../Components/pseo/Link';
import { LegalLayout } from '../Components/legal/LegalLayout';
import { JsonLd, breadcrumbs } from '../Components/seo/JsonLd';
import { Section, linkCls } from '../Components/pseo/Blocks';
import { TOOLS, TOOL_CATEGORIES } from '../lib/tools/tools.mjs';
import { CHAR_COUNT } from '../lib/unicode/unicode';
import { PAIRS } from '../lib/convert/units.mjs';
import { SITE_URL } from '../lib/site';

export const metadata: Metadata = {
  title: 'Free developer and data tools that run in your browser — AnalyzeIt',
  description: 'JSON formatter, CSV to JSON, Base64, URL encoding, Unix timestamps, hashes, UUIDs, regex tester, colour converter and more. Nothing you paste leaves your browser.',
  alternates: { canonical: '/tools' },
};

export default function Page() {
  return (
    <LegalLayout title="Tools." eyebrow={false} showHeroUpdated={false} quietOperator subtitle="Small, private utilities for working with data and code. Each one runs in your browser and is tested against the examples on its page.">
      <JsonLd data={breadcrumbs(SITE_URL, [{ name: 'Home', path: '/' }, { name: 'Tools', path: '/tools' }])} />
      {TOOL_CATEGORIES.map((c) => (
        <Section key={c} title={c}>
          <ul className="space-y-2">
            {TOOLS.filter((t) => t.category === c).map((t) => (
              <li key={t.slug}>
                <Link href={`/tools/${t.slug}`} className={linkCls}>{t.name}</Link>
                <p className="text-[13px]">{t.description}</p>
              </li>
            ))}
          </ul>
        </Section>
      ))}
      <Section title="Reference">
        <ul className="list-disc space-y-1.5 pl-5">
          <li><Link href="/unicode" className={linkCls}>Unicode character lookup</Link>: {CHAR_COUNT.toLocaleString('en-US')} characters with codes for HTML, CSS and programming languages.</li>
          <li><Link href="/convert" className={linkCls}>Unit conversions</Link>: {PAIRS.length} conversions with exact formulas.</li>
          <li><Link href="/metrics" className={linkCls}>Business metrics</Link> and <Link href="/methods" className={linkCls}>statistics methods</Link> with Excel, SQL and Python.</li>
          <li><Link href="/data" className={linkCls}>Country data</Link> from the World Bank.</li>
        </ul>
      </Section>
    </LegalLayout>
  );
}
