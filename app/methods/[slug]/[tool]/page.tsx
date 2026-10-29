import type { Metadata } from 'next';
import Link from '../../../Components/pseo/Link';
import { notFound } from 'next/navigation';
import { LegalLayout } from '../../../Components/legal/LegalLayout';
import { JsonLd, breadcrumbs } from '../../../Components/seo/JsonLd';
import { AnswerBox, Bullets, Code, DataTable, LinkList, Section, SourceNote, linkCls } from '../../../Components/pseo/Blocks';
import { DATASETS, DATA_UPDATED } from '../../../lib/pseo/data.mjs';
import { fmt } from '../../../lib/pseo/expr.mjs';
import { METHODS, TOOLS, lower, method, methodTools, methodToolGuide, methodToolMeta, methodValueText, relatedMethods, tool } from '../../../lib/pseo/pages.mjs';
import { SITE_NAME, SITE_URL } from '../../../lib/site';

export const dynamicParams = false;

export function generateStaticParams() {
  return METHODS.flatMap((m) => methodTools(m).map((t) => ({ slug: m.slug, tool: t })));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; tool: string }> }): Promise<Metadata> {
  const { slug, tool: ts } = await params;
  const m = method(slug), t = tool(ts);
  if (!m || !t) return {};
  const meta = methodToolMeta(m, t);
  return {
    title: `${meta.title} — ${SITE_NAME}`,
    description: meta.description,
    alternates: { canonical: `/methods/${m.slug}/${t.slug}` },
    openGraph: { title: meta.title, description: meta.description, url: `${SITE_URL}/methods/${m.slug}/${t.slug}`, type: 'article' },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string; tool: string }> }) {
  const { slug, tool: ts } = await params;
  const m = method(slug), t = tool(ts);
  if (!m || !t || !methodTools(m).includes(t.slug)) notFound();
  const g = methodToolGuide(m, t);
  const meta = methodToolMeta(m, t);
  const path = `/methods/${m.slug}/${t.slug}`;
  const cols = DATASETS.daily.columns.filter((c) => c.key === 'day' || m.columns.includes(c.key));
  const howTo = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: meta.title,
    description: meta.description,
    step: g.steps.map((text, i) => ({ '@type': 'HowToStep', position: i + 1, text })),
    tool: [{ '@type': 'HowToTool', name: t.name }],
    supply: [{ '@type': 'HowToSupply', name: 'daily.csv sample data' }],
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
    about: { '@type': 'DefinedTerm', name: m.name, url: `${SITE_URL}/methods/${m.slug}` },
    isBasedOn: `${SITE_URL}/sample-data/daily.csv`,
  };
  const others = methodTools(m).filter((o) => o !== t.slug).map((o) => TOOLS.find((x) => x.slug === o)!);
  return (
    <LegalLayout title={meta.title} eyebrow={`${m.name} · ${t.short}`} showHeroUpdated={false} quietOperator subtitle={meta.description}>
      <JsonLd data={howTo} />
      <JsonLd data={article} />
      <JsonLd data={breadcrumbs(SITE_URL, [{ name: 'Home', path: '/' }, { name: 'Methods', path: '/methods' }, { name: m.name, path: `/methods/${m.slug}` }, { name: t.name, path }])} />

      <AnswerBox answer={g.answer} formula={m.formula} />

      <Section title="Step by step">
        <Bullets ordered items={g.steps} />
        {g.schema ? <Code label="Table" code={g.schema} /> : null}
      </Section>

      <Section title={t.slug === 'excel' ? 'The formula' : t.slug === 'sql' ? 'The query' : 'The code'}>
        {g.code.map((c) => <Code key={c.label} label={c.label} code={c.code} />)}
        <p>
          Expected result on the sample data: <strong>{methodValueText(m)}</strong>.
        </p>
      </Section>

      <Section title="What the result means">
        <p>{m.read}</p>
      </Section>

      <Section title={`Notes for ${t.short}`}>
        <Bullets items={g.notes} />
      </Section>

      <Section title={`Where ${lower(m.name.replace(/ \(.*\)$/, ''))} misleads`}>
        <Bullets items={m.pitfalls} />
        <p>
          The plain-language explanation is on the <Link href={`/methods/${m.slug}`} className={linkCls}>{m.name}</Link> page.
        </p>
      </Section>

      <Section title="The data">
        <DataTable caption="daily.csv (made up): 30 days from one store" head={cols.map((c) => c.key)} rows={DATASETS.daily.rows.map((r) => cols.map((c) => fmt(Number(r[c.key]), 'count')))} />
      </Section>

      {others.length ? (
        <Section title="Same method, other tools">
          <LinkList items={others.map((o) => ({ href: `/methods/${m.slug}/${o.slug}`, label: `${m.name} in ${o.name}` }))} />
        </Section>
      ) : null}

      <Section title="Related methods">
        <LinkList items={relatedMethods(m).filter((r) => methodTools(r).includes(t.slug)).map((r) => ({ href: `/methods/${r.slug}/${t.slug}`, label: `How to calculate ${lower(r.name.replace(/ \(.*\)$/, ''))} in ${t.name}` }))} />
      </Section>

      <SourceNote dataset="daily" />
    </LegalLayout>
  );
}
