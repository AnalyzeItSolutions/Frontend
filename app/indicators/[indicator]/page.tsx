import type { Metadata } from 'next';
import Link from '../../Components/pseo/Link';
import { notFound } from 'next/navigation';
import { LegalLayout } from '../../Components/legal/LegalLayout';
import { JsonLd, breadcrumbs } from '../../Components/seo/JsonLd';
import { AnswerBox, Section, linkCls } from '../../Components/pseo/Blocks';
import { fmtValue, kindOf, lowerFirst } from '../../lib/wdi/describe.mjs';
import { INDICATORS, cellsFor, definition, indicator } from '../../lib/wdi/wdi';
import { SITE_URL } from '../../lib/site';
import { indicatorSnippet } from '../../lib/seo/snippets.mjs';

export const revalidate = 2592000;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type Params = Promise<{ indicator: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const ind = indicator((await params).indicator);
  if (!ind) return {};
  const economies = cellsFor(ind).filter((e) => !e.country.aggregate);
  // The year most economies last reported: what the ranking mostly reflects.
  const years = new Map<number, number>();
  for (const e of economies) years.set(e.cell[3], (years.get(e.cell[3]) ?? 0) + 1);
  const year = [...years].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0]?.[0];
  const { title, description } = indicatorSnippet({ indicator: ind.name, year, economies: economies.length });
  return {
    title,
    description,
    alternates: { canonical: `/indicators/${ind.slug}` },
  };
}

export default async function Page({ params }: { params: Params }) {
  const ind = indicator((await params).indicator);
  if (!ind) notFound();
  const kind = kindOf(ind.name);
  const rows = cellsFor(ind);
  const economies = rows.filter((e) => !e.country.aggregate).sort((a, b) => b.cell[4] - a.cell[4]);
  const groups = rows.filter((e) => e.country.aggregate).sort((a, b) => a.country.name.localeCompare(b.country.name));
  const def = definition(ind.id);
  const top = economies[0], bottom = economies[economies.length - 1];
  const world = groups.find((g) => g.country.iso3 === 'WLD');
  const related = INDICATORS.filter((i) => i.topic === ind.topic && i.id !== ind.id).slice(0, 12);
  const table = (list: typeof rows, ranked: boolean) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            {ranked ? <th scope="col" className="border-b border-[var(--border)] px-2 py-1.5 text-right">#</th> : null}
            <th scope="col" className="border-b border-[var(--border)] px-2 py-1.5 text-left">{ranked ? 'Economy' : 'Region or group'}</th>
            <th scope="col" className="border-b border-[var(--border)] px-2 py-1.5 text-right">Latest value</th>
            <th scope="col" className="border-b border-[var(--border)] px-2 py-1.5 text-right">Year</th>
          </tr>
        </thead>
        <tbody>
          {list.map((e, i) => (
            <tr key={e.country.iso3}>
              {ranked ? <td className="border-b border-[var(--border)]/60 px-2 py-1 text-right tabular-nums">{i + 1}</td> : null}
              <td className="border-b border-[var(--border)]/60 px-2 py-1"><Link href={`/data/${e.country.slug}/${ind.slug}`} className={linkCls}>{e.country.name}</Link></td>
              <td className="border-b border-[var(--border)]/60 px-2 py-1 text-right tabular-nums whitespace-nowrap">{fmtValue(e.cell[4], kind)}</td>
              <td className="border-b border-[var(--border)]/60 px-2 py-1 text-right tabular-nums">{e.cell[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return (
    <LegalLayout title={`${ind.name} by country`} eyebrow={ind.topic} showHeroUpdated={false} quietOperator subtitle={`Latest figures for ${economies.length} economies from the World Bank's World Development Indicators (${ind.id}).`}>
      <JsonLd data={breadcrumbs(SITE_URL, [{ name: 'Home', path: '/' }, { name: 'Indicators', path: '/indicators' }, { name: ind.name, path: `/indicators/${ind.slug}` }])} />
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'Dataset', name: `${ind.name} by country`, description: (def.def || ind.name).slice(0, 4900), url: `${SITE_URL}/indicators/${ind.slug}`, identifier: ind.id, license: 'https://creativecommons.org/licenses/by/4.0/', isAccessibleForFree: true, creator: { '@type': 'Organization', name: 'The World Bank' }, spatialCoverage: 'World' }} />
      {top && bottom ? (
        <AnswerBox
          answer={`Of the economies in the World Bank's latest release, ${top.country.name} has the highest ${lowerFirst(ind.name)} (${fmtValue(top.cell[4], kind)} in ${top.cell[3]}) and ${bottom.country.name} the lowest (${fmtValue(bottom.cell[4], kind)} in ${bottom.cell[3]}).${world ? ` The world figure is ${fmtValue(world.cell[4], kind)} (${world.cell[3]}).` : ''}`}
        />
      ) : null}
      <Section title="What this measures">
        {def.def ? <p>{def.def}</p> : null}
        {def.limits ? <p><strong>Limitations:</strong> {def.limits}</p> : null}
        <p>Each country&apos;s latest available year is shown; countries report on different schedules, so compare years before comparing values.</p>
      </Section>
      <Section title="Ranking">{table(economies, true)}</Section>
      {groups.length ? <Section title="Regions and income groups">{table(groups, false)}</Section> : null}
      {related.length ? (
        <Section title={`More ${ind.topic.toLowerCase()} indicators`}>
          <ul className="list-disc space-y-1.5 pl-5">
            {related.map((r) => <li key={r.id}><Link href={`/indicators/${r.slug}`} className={linkCls}>{r.name}</Link></li>)}
          </ul>
        </Section>
      ) : null}
      <Section title="Source">
        <p>
          World Bank, World Development Indicators, <code>{ind.id}</code>, CC BY 4.0. {ind.source ? <>Original source: {ind.source} </> : null}
          <a href={`https://data.worldbank.org/indicator/${ind.id}`} className={linkCls} rel="noopener" target="_blank">View on data.worldbank.org</a>.
        </p>
      </Section>
    </LegalLayout>
  );
}
