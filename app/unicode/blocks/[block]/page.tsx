import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LegalLayout } from '../../../Components/legal/LegalLayout';
import { JsonLd, breadcrumbs } from '../../../Components/seo/JsonLd';
import { Section, linkCls } from '../../../Components/pseo/Blocks';
import { GENERAL_CATEGORY, isVisible, scriptName, uPlus } from '../../../lib/unicode/encode.mjs';
import { BLOCKS, UNICODE_VERSION, block, charPath, charsIn, displayName, glyph } from '../../../lib/unicode/unicode';
import { SITE_NAME, SITE_URL } from '../../../lib/site';

export const revalidate = 31536000;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type Params = Promise<{ block: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const b = block((await params).block);
  if (!b || !b.count) return {};
  return {
    title: `${b.name} Unicode block (${uPlus(b.start)}–${uPlus(b.end)}): all ${b.count} characters — ${SITE_NAME}`,
    description: `Every character in the ${b.name} block, ${uPlus(b.start)} to ${uPlus(b.end)}, with names and codes for HTML, CSS, JavaScript and Python. Unicode ${UNICODE_VERSION}.`.slice(0, 160),
    alternates: { canonical: `/unicode/blocks/${b.slug}` },
  };
}

export default async function Page({ params }: { params: Params }) {
  const b = block((await params).block);
  if (!b || !b.count) notFound();
  const list = charsIn(b);
  const cats = Object.entries(list.reduce<Record<string, number>>((a, c) => ((a[c.gc] = (a[c.gc] ?? 0) + 1), a), {})).sort((x, y) => y[1] - x[1]);
  const scripts = [...new Set(list.map((c) => c.script).filter(Boolean))];
  const prev = BLOCKS.slice(0, b.index).reverse().find((x) => x.count), next = BLOCKS.slice(b.index + 1).find((x) => x.count);
  return (
    <LegalLayout title={b.name} eyebrow={`Unicode block · ${uPlus(b.start)}–${uPlus(b.end)}`} showHeroUpdated={false} quietOperator subtitle={`${b.count} named characters in this block, out of ${b.end - b.start + 1} code points it reserves.`}>
      <JsonLd data={breadcrumbs(SITE_URL, [{ name: 'Home', path: '/' }, { name: 'Unicode', path: '/unicode' }, { name: b.name, path: `/unicode/blocks/${b.slug}` }])} />
      <p>
        Mostly {cats.slice(0, 3).map(([gc, n]) => `${(GENERAL_CATEGORY[gc] ?? gc).toLowerCase()}s (${n})`).join(', ')}
        {scripts.length ? `, in the ${scripts.slice(0, 4).map((s) => scriptName(s!)).join(', ')} script${scripts.length > 1 ? 's' : ''}` : ''}. Select a character for its codes and properties.
      </p>
      <Section title="Characters">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {['', 'Code', 'Name', 'HTML'].map((h) => <th key={h} scope="col" className="border-b border-[var(--border)] px-2 py-1.5 text-left">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.cp}>
                  <td className="border-b border-[var(--border)]/60 px-2 py-1 text-lg">{isVisible(c.gc) ? glyph(c) : ''}</td>
                  <td className="border-b border-[var(--border)]/60 px-2 py-1 font-mono whitespace-nowrap">{uPlus(c.cp)}</td>
                  <td className="border-b border-[var(--border)]/60 px-2 py-1"><Link href={charPath(c)} className={linkCls}>{displayName(c)}</Link></td>
                  <td className="border-b border-[var(--border)]/60 px-2 py-1 font-mono whitespace-nowrap">{c.entities?.[0] ?? `&#${c.cp};`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <p>
        {prev ? <>Previous block: <Link href={`/unicode/blocks/${prev.slug}`} className={linkCls}>{prev.name}</Link>. </> : null}
        {next ? <>Next block: <Link href={`/unicode/blocks/${next.slug}`} className={linkCls}>{next.name}</Link>. </> : null}
        <Link href="/unicode" className={linkCls}>All blocks</Link>. Source: Unicode Character Database {UNICODE_VERSION}.
      </p>
    </LegalLayout>
  );
}
