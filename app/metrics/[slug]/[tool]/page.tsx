import type { Metadata } from 'next';
import Link from '../../../Components/pseo/Link';
import { notFound } from 'next/navigation';
import { LegalLayout } from '../../../Components/legal/LegalLayout';
import { JsonLd, breadcrumbs } from '../../../Components/seo/JsonLd';
import { GUIDE_FOR_TOOL } from '../../../lib/links/graph.mjs';
import { GuideList } from '../../../Components/pseo/Related';
import { AnswerBox, Bullets, Code, DataTable, LinkList, Section, SourceNote, linkCls } from '../../../Components/pseo/Blocks';
import { DATASETS, DATA_UPDATED } from '../../../lib/pseo/data.mjs';
import { fmt } from '../../../lib/pseo/expr.mjs';
import { METRICS, metric } from '../../../lib/pseo/metrics.mjs';
import { TOOLS, lower, metricColumns, metricTitle, relatedMetrics, summary, tool, toolGuide, toolMeta } from '../../../lib/pseo/pages.mjs';
import { SITE_NAME, SITE_URL } from '../../../lib/site';
import { withBrand } from '../../../lib/seo/snippets.mjs';

export const dynamicParams = false;

export function generateStaticParams() {
  return METRICS.flatMap((m) => TOOLS.map((t) => ({ slug: m.slug, tool: t.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; tool: string }> }): Promise<Metadata> {
  const { slug, tool: ts } = await params;
  const m = metric(slug), t = tool(ts);
  if (!m || !t) return {};
  const meta = toolMeta(m, t);
  return {
    title: withBrand(meta.title),
    description: meta.description,
    alternates: { canonical: `/metrics/${m.slug}/${t.slug}` },
    openGraph: { title: meta.title, description: meta.description, url: `${SITE_URL}/metrics/${m.slug}/${t.slug}`, type: 'article' },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string; tool: string }> }) {
  const { slug, tool: ts } = await params;
  const m = metric(slug), t = tool(ts);
  if (!m || !t) notFound();
  const g = toolGuide(m, t);
  const s = summary(m);
  const cols = metricColumns(m);
  const meta = toolMeta(m, t);
  const path = `/metrics/${m.slug}/${t.slug}`;
  const howTo = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: meta.title,
    description: meta.description,
    step: g.steps.map((text, i) => ({ '@type': 'HowToStep', position: i + 1, text })),
    tool: [{ '@type': 'HowToTool', name: t.name }],
    supply: [{ '@type': 'HowToSupply', name: 'monthly.csv sample data' }],
  };
  const article = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: meta.title,
    description: meta.description,
    dateModified: DATA_UPDATED,
    mainEntityOfPage: `${SITE_URL}${path}`,
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    about: { '@type': 'DefinedTerm', name: m.name, url: `${SITE_URL}/metrics/${m.slug}` },
    isBasedOn: `${SITE_URL}/sample-data/monthly.csv`,
  };
  const others = TOOLS.filter((o) => o.slug !== t.slug);
  return (
    <LegalLayout title={meta.title} eyebrow={`${metricTitle(m)} · ${t.short}`} showHeroUpdated={false} quietOperator subtitle={meta.description}>
      <JsonLd data={howTo} />
      <JsonLd data={article} />
      <JsonLd data={breadcrumbs(SITE_URL, [{ name: 'Home', path: '/' }, { name: 'Metrics', path: '/metrics' }, { name: m.name, path: `/metrics/${m.slug}` }, { name: t.name, path }])} />

      <AnswerBox answer={g.answer} formula={m.formula} />

      <Section title="What you need">
        <p>
          {m.answer.split('. ')[0].replace(/\.$/, '')}. You need these columns, here from the sample file{' '}
          <a href="/sample-data/monthly.csv" className={linkCls} download>monthly.csv</a>:
        </p>
        <Bullets items={g.layout} />
        {g.schema ? <Code label="Table" code={g.schema} /> : null}
      </Section>

      <Section title="Step by step">
        <Bullets ordered items={g.steps} />
      </Section>

      <Section title={t.slug === 'excel' ? 'The formulas' : t.slug === 'sql' ? 'The queries' : 'The code'}>
        {g.code.map((c) => <Code key={c.label} label={c.label} code={c.code} />)}
      </Section>

      <Section title="What you should get">
        <p>Run against the sample data, the code above returns these values{m.unit === 'pct' && t.slug !== 'excel' ? ' (in percent)' : ''}:</p>
        <DataTable
          caption={`${m.name} from the sample data`}
          head={['Month', ...cols.map((c) => c.key), m.column_name]}
          rows={[
            ...DATASETS.monthly.rows.map((r, i) => [String(r.month), ...cols.map((c) => fmt(Number(r[c.key]), 'count')), fmt(s.perMonth[i].value, m.unit)]),
            ['Whole period', ...cols.map((c) => (m.kind ? '' : fmt(s.inputs[c.key], 'count'))), s.overallText],
          ]}
        />
        <p className="font-mono text-[13px] text-[var(--text-primary)]">{s.worked}</p>
      </Section>

      <Section title={`Notes for ${t.short}`}>
        <Bullets items={g.notes} />
      </Section>

      <Section title={`Where ${lower(m.name)} misleads`}>
        <Bullets items={m.pitfalls} />
        <p>
          The full explanation, with a calculator, is on the <Link href={`/metrics/${m.slug}`} className={linkCls}>{metricTitle(m)}</Link> page.
        </p>
      </Section>

      <Section title="Same metric, other tools">
        <LinkList items={others.map((o) => ({ href: `/metrics/${m.slug}/${o.slug}`, label: `${m.name} in ${o.name}` }))} />
      </Section>

      <Section title={`Related metrics in ${t.name}`}>
        <LinkList items={relatedMetrics(m).map((r) => ({ href: `/metrics/${r.slug}/${t.slug}`, label: `How to calculate ${lower(r.name)} in ${t.name}` }))} />
      </Section>

      <GuideList slugs={[GUIDE_FOR_TOOL[t.slug], 'find-what-changed-in-your-data'].filter(Boolean)} title={`Learn more about ${t.short}`} />

      <SourceNote dataset="monthly" />
    </LegalLayout>
  );
}
