import type { Metadata } from 'next';
import Link from '../Components/pseo/Link';
import { LegalLayout } from '../Components/legal/LegalLayout';
import { JsonLd, breadcrumbs } from '../Components/seo/JsonLd';
import { Section, linkCls } from '../Components/pseo/Blocks';
import { METHODS, METHOD_CATEGORIES, TOOLS, methodTools } from '../lib/pseo/pages.mjs';
import { SITE_URL } from '../lib/site';

export const metadata: Metadata = {
  title: 'Statistics methods explained, with Excel, SQL and Python — AnalyzeIt',
  description: 'Mean, median, standard deviation, outliers, correlation, regression, t-tests and more: plain explanations, a worked example on real numbers, and code that runs.',
  alternates: { canonical: '/methods' },
};

export default function Page() {
  const list = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'Statistics methods',
    url: `${SITE_URL}/methods`,
    hasDefinedTerm: METHODS.map((m) => ({ '@type': 'DefinedTerm', name: m.name, url: `${SITE_URL}/methods/${m.slug}` })),
  };
  return (
    <LegalLayout
      title="Statistics, worked through."
      eyebrow={false}
      showHeroUpdated={false}
      quietOperator
      subtitle={`${METHODS.length} methods used to describe and question business numbers, each explained in plain words and worked on the same 30 days of sample data, with Excel, SQL and Python that return the same answer.`}
    >
      <JsonLd data={list} />
      <JsonLd data={breadcrumbs(SITE_URL, [{ name: 'Home', path: '/' }, { name: 'Methods', path: '/methods' }])} />
      <p>
        The data is 30 made-up days of orders from one store, including one sale day that behaves very differently from the rest. Download it as{' '}
        <a href="/sample-data/daily.csv" className={linkCls} download>daily.csv</a>; every page shows it in full.
      </p>
      {METHOD_CATEGORIES.map((c) => (
        <Section key={c.slug} id={c.slug} title={c.name}>
          <ul className="space-y-2">
            {METHODS.filter((m) => m.category === c.slug).map((m) => (
              <li key={m.slug}>
                <Link href={`/methods/${m.slug}`} className={linkCls}>{m.name}</Link>
                <span className="text-[var(--text-muted)]">
                  {' '}·{' '}
                  {methodTools(m).map((ts, i) => (
                    <span key={ts}>
                      {i ? ', ' : ''}
                      <Link href={`/methods/${m.slug}/${ts}`} className="hover:underline">{TOOLS.find((t) => t.slug === ts)!.short}</Link>
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      ))}
      <p>
        For business formulas such as conversion rate, CAC or churn, see <Link href="/metrics" className={linkCls}>business metrics</Link>. New to analysis? Start with{' '}
        <Link href="/guides/data-analysis-steps" className={linkCls}>how to do data analysis</Link>,{' '}
        <Link href="/guides/data-analysis-methods-and-techniques" className={linkCls}>which method answers which question</Link> or{' '}
        <Link href="/guides/data-analysis-examples" className={linkCls}>six worked examples</Link>.
      </p>
    </LegalLayout>
  );
}
