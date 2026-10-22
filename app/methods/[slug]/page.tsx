import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LegalLayout } from '../../Components/legal/LegalLayout';
import { JsonLd, breadcrumbs } from '../../Components/seo/JsonLd';
import { AnswerBox, Bullets, Code, DataTable, Faq, LinkList, Section, SourceNote, linkCls } from '../../Components/pseo/Blocks';
import { DATASETS, DATA_UPDATED } from '../../lib/pseo/data.mjs';
import { fmt } from '../../lib/pseo/expr.mjs';
import { METHODS, TOOLS, method, methodCategoryName, methodFaq, methodMeta, methodTools, methodValueText, relatedMethods } from '../../lib/pseo/pages.mjs';
import { SITE_NAME, SITE_URL } from '../../lib/site';

export const dynamicParams = false;

export function generateStaticParams() {
  return METHODS.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const m = method(slug);
  if (!m) return {};
  const meta = methodMeta(m);
  return {
    title: `${meta.title} — ${SITE_NAME}`,
    description: meta.description,
    alternates: { canonical: `/methods/${m.slug}` },
    openGraph: { title: meta.title, description: meta.description, url: `${SITE_URL}/methods/${m.slug}`, type: 'article' },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = method(slug);
  if (!m) notFound();
  const meta = methodMeta(m);
  const cols = DATASETS.daily.columns.filter((c) => c.key === 'day' || m.columns.includes(c.key));
  const url = `${SITE_URL}/methods/${m.slug}`;
  const article = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: meta.title,
    description: meta.description,
    dateModified: DATA_UPDATED,
    mainEntityOfPage: url,
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    about: { '@type': 'DefinedTerm', name: m.name, description: m.answer, inDefinedTermSet: { '@type': 'DefinedTermSet', name: 'Statistics methods', url: `${SITE_URL}/methods` } },
    isBasedOn: `${SITE_URL}/sample-data/daily.csv`,
  };
  const tools = methodTools(m);
  return (
    <LegalLayout title={m.name} eyebrow={methodCategoryName(m.category)} showHeroUpdated={false} quietOperator subtitle="What it means, when to use it, and how to calculate it, worked on numbers you can check.">
      <JsonLd data={article} />
      <JsonLd data={breadcrumbs(SITE_URL, [{ name: 'Home', path: '/' }, { name: 'Methods', path: '/methods' }, { name: m.name, path: `/methods/${m.slug}` }])} />

      <AnswerBox answer={m.answer} formula={m.formula} result={<>On the 30-day sample below: <strong>{methodValueText(m)}</strong>.</>} />

      <Section title="When to use it">
        <p>{m.why}</p>
      </Section>

      <Section title="Worked example">
        <p>{m.read}</p>
        {m.excel ? <Code label="Excel or Google Sheets" code={m.excel} /> : null}
        <DataTable caption="Sample data (made up): 30 days from one store" head={cols.map((c) => c.label)} rows={DATASETS.daily.rows.map((r) => cols.map((c) => fmt(Number(r[c.key]), c.unit)))} />
      </Section>

      <Section title="Common mistakes">
        <Bullets items={m.pitfalls} />
      </Section>

      <Section title="Calculate it yourself">
        <LinkList items={tools.map((ts) => ({ href: `/methods/${m.slug}/${ts}`, label: `${m.name} in ${TOOLS.find((t) => t.slug === ts)!.name}` }))} />
      </Section>

      <Section title="Related methods">
        <LinkList items={relatedMethods(m).map((r) => ({ href: `/methods/${r.slug}`, label: r.name }))} />
        <p>
          See <Link href="/methods" className={linkCls}>all statistics methods</Link> or the <Link href="/metrics" className={linkCls}>business metrics</Link> they are used on.
        </p>
      </Section>

      <Faq items={methodFaq(m)} />

      <SourceNote dataset="daily" />
    </LegalLayout>
  );
}
