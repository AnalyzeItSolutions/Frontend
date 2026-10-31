import type { Metadata } from 'next';
import Link from '../../Components/pseo/Link';
import { notFound } from 'next/navigation';
import { LegalLayout } from '../../Components/legal/LegalLayout';
import { JsonLd, breadcrumbs } from '../../Components/seo/JsonLd';
import { METRIC_GUIDES, METRIC_METHODS } from '../../lib/links/graph.mjs';
import { GuideList, MethodList } from '../../Components/pseo/Related';
import { AnswerBox, Bullets, Code, DataTable, Faq, LinkList, Section, SourceNote, linkCls } from '../../Components/pseo/Blocks';
import { MetricCalculator } from '../../Components/pseo/MetricCalculator';
import { DATASETS, DATA_UPDATED } from '../../lib/pseo/data.mjs';
import { excel, fmt } from '../../lib/pseo/expr.mjs';
import { METRICS, metric } from '../../lib/pseo/metrics.mjs';
import { TOOLS, categoryName, lower, metricColumns, metricFaq, metricMeta, metricTitle, relatedMetrics, summary } from '../../lib/pseo/pages.mjs';
import { SITE_NAME, SITE_URL } from '../../lib/site';
import { withBrand } from '../../lib/seo/snippets.mjs';

export const dynamicParams = false;

export function generateStaticParams() {
  return METRICS.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const m = metric(slug);
  if (!m) return {};
  const meta = metricMeta(m);
  return {
    title: withBrand(meta.title),
    description: meta.description,
    alternates: { canonical: `/metrics/${m.slug}` },
    openGraph: { title: meta.title, description: meta.description, url: `${SITE_URL}/metrics/${m.slug}`, type: 'article' },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = metric(slug);
  if (!m) notFound();
  const s = summary(m);
  const cols = metricColumns(m);
  const rows = DATASETS.monthly.rows;
  const x = excel(m);
  const url = `${SITE_URL}/metrics/${m.slug}`;
  const calcInputs = m.kind
    ? [
        { key: 'first', label: `${cols[0].label}, first period`, value: s.inputs.first },
        { key: 'last', label: `${cols[0].label}, last period`, value: s.inputs.last },
        ...(m.kind === 'cmgr' ? [{ key: 'steps', label: 'Periods between them', value: s.inputs.n }] : []),
      ]
    : cols.map((c) => ({ key: c.key, label: c.label, value: s.inputs[c.key] }));
  const term = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: m.name,
    ...(m.abbr ? { alternateName: m.abbr } : {}),
    description: m.answer,
    url,
    inDefinedTermSet: { '@type': 'DefinedTermSet', name: 'Business metrics', url: `${SITE_URL}/metrics` },
  };
  const article = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: metricMeta(m).title,
    description: metricMeta(m).description,
    dateModified: DATA_UPDATED,
    mainEntityOfPage: url,
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    isBasedOn: `${SITE_URL}/sample-data/monthly.csv`,
  };
  return (
    <LegalLayout title={metricTitle(m)} eyebrow={categoryName(m.category)} showHeroUpdated={false} quietOperator subtitle="What it measures, the formula, a worked example you can check, and a calculator.">
      <JsonLd data={term} />
      <JsonLd data={article} />
      <JsonLd data={breadcrumbs(SITE_URL, [{ name: 'Home', path: '/' }, { name: 'Metrics', path: '/metrics' }, { name: m.name, path: `/metrics/${m.slug}` }])} />

      <AnswerBox answer={m.answer} formula={m.formula} result={<>On the sample data below, six months come to <strong>{s.overallText}</strong>.</>} />

      <Section title="Why it matters">
        <p>{m.why}</p>
      </Section>

      <Section title="Worked example">
        <p>
          The table shows the columns this metric needs from six months of a made-up subscription brand. Add each column up over the six months, then put the totals into the formula:
        </p>
        <DataTable
          caption="Sample data (made up), by month"
          head={['Month', ...cols.map((c) => c.label)]}
          rows={[...rows.map((r) => [String(r.month), ...cols.map((c) => fmt(Number(r[c.key]), c.unit))]), ...(m.kind ? [] : [['Total', ...cols.map((c) => fmt(s.inputs[c.key], c.unit))]])]}
        />
        <p className="font-mono text-[13px] text-[var(--text-primary)]">{s.worked}</p>
        <p>
          Add up first, then divide. Averaging the six monthly figures gives a slightly different answer, because it counts a small month the same as a large one.
        </p>
      </Section>

      <Section title="Month by month">
        <DataTable
          caption={`${m.name} for each month of the sample data`}
          head={['Month', m.name]}
          rows={s.perMonth.map((p) => [p.month, fmt(p.value, m.unit)])}
        />
      </Section>

      <Section title={`${m.abbr || m.name} calculator`}>
        <MetricCalculator name={m.abbr || m.name} unit={m.unit} expr={m.expr} scale={m.scale} kind={m.kind} inputs={calcInputs} />
      </Section>

      <Section title="How to read it">
        <p>{m.read}</p>
      </Section>

      <Section title="Common mistakes">
        <Bullets items={m.pitfalls} />
      </Section>

      <Section title={`Calculate ${lower(m.name)} in Excel, SQL or Python`}>
        <p>The quickest version, for the sample sheet laid out as in the CSV (headers in row 1, months in rows 2 to 7):</p>
        <Code label="Excel or Google Sheets, whole period" code={x.overall} />
        <LinkList items={TOOLS.map((t) => ({ href: `/metrics/${m.slug}/${t.slug}`, label: `${m.name} in ${t.name}`, note: t.slug === 'excel' ? 'per-month formula and zero-safe version' : t.slug === 'sql' ? 'query by month and for the period' : 'pandas script with expected output' }))} />
      </Section>

      <Section title="Related metrics">
        <LinkList items={relatedMetrics(m).map((r) => ({ href: `/metrics/${r.slug}`, label: metricTitle(r) }))} />
        <p>
          See <Link href="/metrics" className={linkCls}>all business metrics</Link>, or the <Link href="/methods" className={linkCls}>statistics methods</Link> that sit behind them.
        </p>
      </Section>

      <Faq items={metricFaq(m)} />

      <MethodList slugs={METRIC_METHODS} title="Check how stable it is" />
      <p className="text-sm text-[var(--text-secondary)]">
        A metric moves for ordinary reasons as well as real ones. These methods separate the two: the spread shows what a normal month looks like, the moving average smooths it,
        the z-score flags a month that is out of line and the trend line shows the direction.
      </p>
      <GuideList slugs={METRIC_GUIDES} title="Guides" />

      <SourceNote dataset="monthly" />
    </LegalLayout>
  );
}
