import type { Metadata } from 'next';
import Link from '../../Components/pseo/Link';
import { notFound } from 'next/navigation';
import { LegalLayout } from '../../Components/legal/LegalLayout';
import { JsonLd, breadcrumbs } from '../../Components/seo/JsonLd';
import { AnswerBox, Code, LinkList, Section, linkCls } from '../../Components/pseo/Blocks';
import { ToolRunner } from '../../Components/pseo/ToolRunner';
import { TOOLS, tool } from '../../lib/tools/tools.mjs';
import { SITE_NAME, SITE_URL } from '../../lib/site';

export const dynamicParams = false;
export function generateStaticParams() {
  return TOOLS.map((t) => ({ tool: t.slug }));
}

type Params = Promise<{ tool: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const t = tool((await params).tool);
  if (!t) return {};
  return { title: `${t.name}: free, runs in your browser — ${SITE_NAME}`, description: t.description, alternates: { canonical: `/tools/${t.slug}` } };
}

export default async function Page({ params }: { params: Params }) {
  const t = tool((await params).tool);
  if (!t) notFound();
  const related = TOOLS.filter((x) => x.category === t.category && x.slug !== t.slug).concat(TOOLS.filter((x) => x.category !== t.category)).slice(0, 8);
  return (
    <LegalLayout title={t.name} eyebrow={`Tools · ${t.category}`} showHeroUpdated={false} quietOperator subtitle={t.description}>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebApplication', name: t.name, description: t.description, url: `${SITE_URL}/tools/${t.slug}`, applicationCategory: 'DeveloperApplication', operatingSystem: 'Any (runs in the browser)', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL } }} />
      <JsonLd data={breadcrumbs(SITE_URL, [{ name: 'Home', path: '/' }, { name: 'Tools', path: '/tools' }, { name: t.name, path: `/tools/${t.slug}` }])} />
      <AnswerBox answer={t.answer} />
      <ToolRunner slug={t.slug} />
      <Section title="How it works">
        {t.how.map((p) => <p key={p}>{p}</p>)}
      </Section>
      {t.examples.length ? (
        <Section title="Examples">
          {t.examples.map((ex, i) => (
            <div key={i} className="space-y-1">
              <Code label={`Input${ex.mode ? ` (${t.modes?.find((m) => m.id === ex.mode)?.label ?? ex.mode})` : ''}`} code={Object.values(ex.values).join('\n')} />
              <Code label="Result" code={ex.output} />
            </div>
          ))}
          <p className="text-xs text-[var(--text-muted)]">These examples are run by the tool itself in our automated tests, so the results shown are what it really returns.</p>
        </Section>
      ) : null}
      <Section title="More tools">
        <LinkList items={related.map((x) => ({ href: `/tools/${x.slug}`, label: x.name }))} />
        <p>
          <Link href="/tools" className={linkCls}>All tools</Link> · <Link href="/unicode" className={linkCls}>Unicode lookup</Link> · <Link href="/convert" className={linkCls}>Unit conversions</Link>
        </p>
      </Section>
    </LegalLayout>
  );
}
