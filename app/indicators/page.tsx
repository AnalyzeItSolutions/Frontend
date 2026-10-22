import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout } from '../Components/legal/LegalLayout';
import { JsonLd, breadcrumbs } from '../Components/seo/JsonLd';
import { Section, linkCls } from '../Components/pseo/Blocks';
import { INDICATORS, TOPICS } from '../lib/wdi/wdi';
import { SITE_URL } from '../lib/site';

export const metadata: Metadata = {
  title: 'World Bank indicators by topic: rankings for every country — AnalyzeIt',
  description: 'Every World Development Indicator with enough data, grouped by topic: economy, health, education, environment, trade, debt and more, each ranked by country.',
  alternates: { canonical: '/indicators' },
};

export default function Page() {
  return (
    <LegalLayout title="Indicators, ranked by country." eyebrow={false} showHeroUpdated={false} quietOperator subtitle={`${INDICATORS.length.toLocaleString('en-US')} indicators from the World Bank's World Development Indicators. Each one ranks every economy with data and links to its full history.`}>
      <JsonLd data={breadcrumbs(SITE_URL, [{ name: 'Home', path: '/' }, { name: 'Indicators', path: '/indicators' }])} />
      {TOPICS.map((t) => (
        <Section key={t} id={t.toLowerCase().replace(/[^a-z]+/g, '-')} title={t}>
          <ul className="list-disc space-y-1 pl-5">
            {INDICATORS.filter((i) => i.topic === t).map((i) => <li key={i.id}><Link href={`/indicators/${i.slug}`} className={linkCls}>{i.name}</Link></li>)}
          </ul>
        </Section>
      ))}
      <p>
        Browse by country instead: <Link href="/data" className={linkCls}>country data</Link>.
      </p>
    </LegalLayout>
  );
}
