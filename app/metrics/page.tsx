import type { Metadata } from 'next';
import Link from '../Components/pseo/Link';
import { LegalLayout } from '../Components/legal/LegalLayout';
import { JsonLd, breadcrumbs } from '../Components/seo/JsonLd';
import { Section, linkCls } from '../Components/pseo/Blocks';
import { METRICS, METRIC_CATEGORIES } from '../lib/pseo/metrics.mjs';
import { TOOLS, metricTitle } from '../lib/pseo/pages.mjs';
import { SITE_URL } from '../lib/site';

export const metadata: Metadata = {
  title: 'Business metrics: formulas, worked examples and calculators — AnalyzeIt',
  description: 'Formulas for ecommerce, D2C, marketing and subscription metrics, each with a worked example on downloadable data and the Excel, SQL and Python to calculate it.',
  alternates: { canonical: '/metrics' },
};

export default function Page() {
  const list = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'Business metrics',
    url: `${SITE_URL}/metrics`,
    hasDefinedTerm: METRICS.map((m) => ({ '@type': 'DefinedTerm', name: m.name, url: `${SITE_URL}/metrics/${m.slug}` })),
  };
  return (
    <LegalLayout
      title="Business metrics, worked out."
      eyebrow={false}
      showHeroUpdated={false}
      quietOperator
      subtitle={`${METRICS.length} metrics for online brands and subscription businesses. Each has a plain definition, the formula, a worked example on data you can download, a calculator, and the same calculation in Excel, SQL and Python.`}
    >
      <JsonLd data={list} />
      <JsonLd data={breadcrumbs(SITE_URL, [{ name: 'Home', path: '/' }, { name: 'Metrics', path: '/metrics' }])} />
      <p>
        Every figure on these pages is computed from one small made-up dataset, printed on each page and downloadable as{' '}
        <a href="/sample-data/monthly.csv" className={linkCls} download>monthly.csv</a>, so you can check the arithmetic yourself. The code is run against the same
        rows before publishing.
      </p>
      {METRIC_CATEGORIES.map((c) => {
        const items = METRICS.filter((m) => m.category === c.slug);
        if (!items.length) return null;
        return (
          <Section key={c.slug} id={c.slug} title={c.name}>
            <ul className="space-y-2">
              {items.map((m) => (
                <li key={m.slug}>
                  <Link href={`/metrics/${m.slug}`} className={linkCls}>{metricTitle(m)}</Link>
                  <span className="text-[var(--text-muted)]">
                    {' '}·{' '}
                    {TOOLS.map((t, i) => (
                      <span key={t.slug}>
                        {i ? ', ' : ''}
                        <Link href={`/metrics/${m.slug}/${t.slug}`} className="hover:underline">{t.short}</Link>
                      </span>
                    ))}
                  </span>
                  <p className="text-[13px]">{m.formula}</p>
                </li>
              ))}
            </ul>
          </Section>
        );
      })}
      <p>
        Looking for the statistics underneath, such as standard deviation, correlation or a t-test? See the <Link href="/methods" className={linkCls}>statistics methods</Link>, or the guides on{' '}
        <Link href="/guides/excel-data-analysis" className={linkCls}>Excel data analysis</Link> and{' '}
        <Link href="/guides/python-and-sql-for-data-analysis" className={linkCls}>Python and SQL</Link>.
      </p>
    </LegalLayout>
  );
}
