import React from 'react';
import type { Metadata } from 'next';
import Link from '../../Components/pseo/Link';
import { notFound } from 'next/navigation';
import { LegalLayout } from '../../Components/legal/LegalLayout';
import { JsonLd, breadcrumbs } from '../../Components/seo/JsonLd';
import { Code, Faq } from '../../Components/pseo/Blocks';
import { GUIDES, guide, readMinutes } from '../../lib/guides.mjs';
import { withBrand } from '../../lib/seo/snippets.mjs';
import { SITE_NAME, SITE_URL } from '../../lib/site';

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

/** Text with [label](/path) links. Guides use only site-relative links. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\(\/[^)]*\))/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\[([^\]]+)\]\((\/[^)]*)\)$/);
        return m ? (
          <Link key={i} href={m[2]} className="text-[var(--text-primary)] underline underline-offset-2">{m[1]}</Link>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        );
      })}
    </>
  );
}

type Table = { caption?: string; head: string[]; rows: string[][] };

function GuideTable({ caption, head, rows }: Table) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        {caption ? <caption className="mb-2 text-left text-xs text-[var(--text-muted)]">{caption}</caption> : null}
        <thead>
          <tr>{head.map((h) => <th key={h} scope="col" className="border-b border-[var(--border)] px-2 py-1.5 text-left font-medium text-[var(--text-primary)]">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((v, i) => (
                <td key={i} className={`border-b border-[var(--border)]/60 px-2 py-1.5 align-top ${v.startsWith('=') ? 'font-mono text-[12px] break-all' : ''}`}><Inline text={v} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = guide(slug);
  if (!g) return {};
  return {
    title: g.seoTitle ? withBrand(g.seoTitle) : `${g.title} — ${SITE_NAME}`,
    description: g.description,
    alternates: { canonical: `/guides/${g.slug}` },
    openGraph: { title: g.title, description: g.description, url: `${SITE_URL}/guides/${g.slug}`, type: 'article', publishedTime: g.published },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = guide(slug);
  if (!g) notFound();
  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: g.title,
    description: g.description,
    datePublished: g.published,
    dateModified: g.updated ?? g.published,
    mainEntityOfPage: `${SITE_URL}/guides/${g.slug}`,
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
  };
  // Related reading: the longer guides first (they link to each other), then the rest, capped so the list stays useful.
  const others = [...GUIDES.filter((o) => o.slug !== g.slug)].sort((a, b) => Number(!!b.seoTitle) - Number(!!a.seoTitle)).slice(0, 8);
  return (
    <LegalLayout title={g.title} eyebrow={false} showHeroUpdated={false} quietOperator subtitle={`${readMinutes(g)} min read · ${new Date(g.published).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}`}>
      <JsonLd data={article} />
      <JsonLd data={breadcrumbs(SITE_URL, [{ name: 'Home', path: '/' }, { name: 'Guides', path: '/guides' }, { name: g.title, path: `/guides/${g.slug}` }])} />
      <article className="max-w-2xl space-y-5 text-[15px] leading-relaxed text-[#383838] dark:text-[#DCDCDC] [&_h2]:mt-8 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-[#2D2D2D] dark:[&_h2]:text-[#EDEDED] [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {g.blocks.map((b, i) =>
          b.h2 ? (
            <h2 key={i}>{b.h2}</h2>
          ) : b.ul ? (
            <ul key={i}>{b.ul.map((t: string) => <li key={t}><Inline text={t} /></li>)}</ul>
          ) : b.ol ? (
            <ol key={i}>{b.ol.map((t: string) => <li key={t}><Inline text={t} /></li>)}</ol>
          ) : b.code ? (
            <Code key={i} label={b.code.label} code={b.code.code} />
          ) : b.table ? (
            <GuideTable key={i} {...b.table} />
          ) : b.faq ? (
            <Faq key={i} items={b.faq} />
          ) : (
            <p key={i}><Inline text={b.p ?? ''} /></p>
          ),
        )}
        <p>
          Read more: <Link href={g.cta.href} className="text-[var(--text-primary)] underline underline-offset-2">{g.cta.label}</Link>, or{' '}
          <Link href="/demo" className="text-[var(--text-primary)] underline underline-offset-2">try the live demo</Link> with no account.
        </p>
      </article>
      <section className="mt-10 max-w-2xl">
        <h2 className="font-serif text-xl text-[#2D2D2D] dark:text-[#EDEDED]">More guides</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px]">
          {others.map((o) => (
            <li key={o.slug}>
              <Link href={`/guides/${o.slug}`} className="text-[var(--text-primary)] underline underline-offset-2">{o.title}</Link>
            </li>
          ))}
        </ul>
      </section>
    </LegalLayout>
  );
}
