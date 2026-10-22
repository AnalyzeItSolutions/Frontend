import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LegalLayout } from '../../../Components/legal/LegalLayout';
import { JsonLd, breadcrumbs } from '../../../Components/seo/JsonLd';
import { AnswerBox, DataTable, Faq, LinkList, Section, linkCls } from '../../../Components/pseo/Blocks';
import { LineChart } from '../../../Components/pseo/LineChart';
import { lowerFirst, changeSentence, fmtExact, fmtValue, kindOf, ordinal, rankAmong, summarize } from '../../../lib/wdi/describe.mjs';
import { COUNTRIES, apiUrl, cell, cellsFor, country, countryIso3, definition, fetchSeries, indicator, indicatorsFor, sourceUrl } from '../../../lib/wdi/wdi';
import { SITE_NAME, SITE_URL } from '../../../lib/site';

// 221k pages: rendered per request and cached at the CDN (Cache-Control in next.config.ts), not stored as ISR pages,
// so a crawl of the whole set does not consume ISR write units.
export const dynamic = 'force-dynamic';

type Params = Promise<{ country: string; indicator: string }>;

function resolve(cs: string, is: string) {
  const c = country(cs), ind = indicator(is);
  const k = c && ind ? cell(ind, c) : undefined;
  return c && ind && k ? { c, ind, k } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await params;
  const r = resolve(p.country, p.indicator);
  if (!r) return {};
  const { c, ind, k } = r;
  const kind = kindOf(ind.name);
  const title = `${c.name}: ${ind.name}, ${k[2]}–${k[3]}`;
  const description = `${c.name}'s ${lowerFirst(ind.name)} was ${fmtValue(k[4], kind)} in ${k[3]}. ${k[1]} years of World Bank data with chart and ranking.`;
  return {
    title: `${title} — ${SITE_NAME}`,
    description: description.length > 160 ? `${c.name}: ${ind.name} was ${fmtValue(k[4], kind)} in ${k[3]}. World Bank data, ${k[2]}–${k[3]}.`.slice(0, 160) : description,
    alternates: { canonical: `/data/${c.slug}/${ind.slug}` },
    openGraph: { title, description, url: `${SITE_URL}/data/${c.slug}/${ind.slug}`, type: 'article' },
  };
}

export default async function Page({ params }: { params: Params }) {
  const p = await params;
  const r = resolve(p.country, p.indicator);
  if (!r) notFound();
  const { c, ind } = r;
  const series = await fetchSeries(c, ind);
  const kind = kindOf(ind.name);
  const s = summarize(series, kind);
  if (!s) notFound();
  const def = definition(ind.id);
  const lower = lowerFirst(ind.name);
  const path = `/data/${c.slug}/${ind.slug}`;

  // How it compares, from the index (same World Bank release): economies reporting the same latest year, plus aggregates.
  const all = cellsFor(ind);
  const sameYear = all.filter((e) => !e.country.aggregate && e.cell[3] === s.latest.year).map((e) => ({ country: e.country, value: e.cell[4] }));
  const rank = !c.aggregate && sameYear.length >= 10 ? rankAmong(sameYear, s.latest.value) : null;
  const agg = (iso3: string | null | undefined) => { const a = countryIso3(iso3); const e = a && cell(ind, a); return a && e ? { country: a, year: e[3], value: e[4] } : null; };
  const incomeAgg = c.income ? COUNTRIES.find((x) => x.aggregate && x.name === c.income) : undefined;
  const comparisons = [agg('WLD'), agg(c.region), incomeAgg ? agg(incomeAgg.iso3) : null].filter((x): x is NonNullable<typeof x> => !!x && x.country.iso3 !== c.iso3);

  const ten = changeSentence(s.ten, kind), five = changeSentence(s.five, kind), since = changeSentence(s.sinceFirst, kind);
  const answer = `${c.name}'s ${lower} was ${fmtValue(s.latest.value, kind)} in ${s.latest.year}, the latest year in the World Bank's World Development Indicators.${ten ? ` That is ${ten}.` : five ? ` That is ${five}.` : ''}`;
  const neighbours = all.filter((e) => e.country.region === c.region && e.country.iso3 !== c.iso3 && !e.country.aggregate).slice(0, 15);
  const sameTopic = indicatorsFor(c).filter((x) => x.indicator.topic === ind.topic && x.indicator.id !== ind.id).sort((a, b) => b.cell[1] - a.cell[1]).slice(0, 15);

  const faq = [
    { q: `What is ${c.name}'s ${lower}?`, a: `${fmtValue(s.latest.value, kind)} in ${s.latest.year}, according to the World Bank (World Development Indicators).` },
    ...(since ? [{ q: `How has it changed since ${s.first.year}?`, a: `It is ${since}. The highest value was ${fmtValue(s.max.value, kind)} in ${s.max.year} and the lowest ${fmtValue(s.min.value, kind)} in ${s.min.year}.` }] : []),
    ...(rank ? [{ q: `How does ${c.name} rank?`, a: `${ordinal(rank.rank)} highest of ${rank.of} economies with data for ${s.latest.year}.` }] : []),
    { q: 'Where does this data come from?', a: `The World Bank's World Development Indicators, licensed CC BY 4.0. Original source: ${ind.source || 'see the World Bank indicator page'}.` },
  ];
  const dataset = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${c.name}: ${ind.name}`,
    description: `${ind.name} for ${c.name}, yearly from ${s.first.year} to ${s.latest.year}. ${def.def}`.slice(0, 4900),
    url: `${SITE_URL}${path}`,
    sameAs: sourceUrl(c, ind),
    identifier: ind.id,
    keywords: [c.name, ind.name, ind.topic, 'World Development Indicators'],
    license: 'https://creativecommons.org/licenses/by/4.0/',
    isAccessibleForFree: true,
    creator: { '@type': 'Organization', name: 'The World Bank', url: 'https://www.worldbank.org' },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    temporalCoverage: `${s.first.year}/${s.latest.year}`,
    spatialCoverage: { '@type': 'Place', name: c.name },
    distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: apiUrl(c, ind) }],
  };

  return (
    <LegalLayout title={`${c.name}: ${ind.name}`} eyebrow={`${ind.topic} · ${c.name}`} showHeroUpdated={false} quietOperator subtitle={`Yearly data from ${s.first.year} to ${s.latest.year}, from the World Bank.`}>
      <JsonLd data={dataset} />
      <JsonLd data={breadcrumbs(SITE_URL, [{ name: 'Home', path: '/' }, { name: 'Data', path: '/data' }, { name: c.name, path: `/data/${c.slug}` }, { name: ind.name, path }])} />

      <AnswerBox answer={answer} />

      <LineChart points={series.map((p) => ({ x: p.year, y: p.value }))} label={`${ind.name}, ${c.name}, ${s.first.year}–${s.latest.year}. Source: World Bank.`} format={(v) => fmtValue(v, kind)} />

      <Section title="Key figures">
        <DataTable
          head={['', 'Value', 'Year']}
          rows={[
            ['Latest', fmtValue(s.latest.value, kind), String(s.latest.year)],
            ...(s.five ? [['Five years earlier', fmtValue(s.five.from.value, kind), String(s.five.from.year)]] : []),
            ...(s.ten ? [['Ten years earlier', fmtValue(s.ten.from.value, kind), String(s.ten.from.year)]] : []),
            ['Highest', fmtValue(s.max.value, kind), String(s.max.year)],
            ['Lowest', fmtValue(s.min.value, kind), String(s.min.year)],
            [`Average since ${s.avg10From}`, fmtValue(s.avg10, kind), `${s.avg10From}–${s.latest.year}`],
            ['First recorded', fmtValue(s.first.value, kind), String(s.first.year)],
          ]}
        />
        <p>
          {five ? <>Over five years it is {five}. </> : null}
          {since ? <>Since {s.first.year} it is {since}. </> : null}
          {s.missing > 0 ? <>The World Bank has no value for {s.missing} of the years in between; the chart leaves those gaps open rather than joining across them.</> : null}
        </p>
      </Section>

      {rank || comparisons.length ? (
        <Section title="How it compares">
          {rank ? (
            <p>
              In {s.latest.year}, {c.name} had the {ordinal(rank.rank)} highest value of the {rank.of} economies reporting that year. Higher is not always better: for some
              indicators the lowest value is the one to aim for. See the <Link href={`/indicators/${ind.slug}`} className={linkCls}>full ranking</Link>.
            </p>
          ) : (
            <p>See how every economy compares in the <Link href={`/indicators/${ind.slug}`} className={linkCls}>full ranking</Link>.</p>
          )}
          {comparisons.length ? (
            <DataTable head={['', 'Value', 'Year']} rows={[[c.name, fmtValue(s.latest.value, kind), String(s.latest.year)], ...comparisons.map((x) => [x.country.name, fmtValue(x.value, kind), String(x.year)])]} />
          ) : null}
        </Section>
      ) : null}

      <Section title="What this measures">
        {def.def ? <p>{def.def}</p> : null}
        {def.limits ? <p><strong>Limitations:</strong> {def.limits}</p> : null}
        {def.agg ? <p>Regional and income-group figures are computed by the World Bank as a {def.agg.toLowerCase()}.</p> : null}
      </Section>

      <Section title={`All ${s.count} values`}>
        <DataTable head={['Year', ind.name]} rows={[...series].reverse().map((pt) => [String(pt.year), pt.value == null ? 'no data' : fmtExact(pt.value)])} />
      </Section>

      {neighbours.length ? (
        <Section title={`${ind.name} in nearby economies`}>
          <LinkList items={neighbours.map((e) => ({ href: `/data/${e.country.slug}/${ind.slug}`, label: e.country.name, note: `${fmtValue(e.cell[4], kind)} (${e.cell[3]})` }))} />
        </Section>
      ) : null}

      {sameTopic.length ? (
        <Section title={`More ${ind.topic.toLowerCase()} data for ${c.name}`}>
          <LinkList items={sameTopic.map((x) => ({ href: `/data/${c.slug}/${x.indicator.slug}`, label: x.indicator.name, note: `${fmtValue(x.cell[4], kindOf(x.indicator.name))} (${x.cell[3]})` }))} />
          <p>
            Every indicator for {c.name} is on the <Link href={`/data/${c.slug}`} className={linkCls}>{c.name} data page</Link>.
          </p>
        </Section>
      ) : null}

      <Faq items={faq} />

      <Section title="Source">
        <p>
          World Bank, World Development Indicators, indicator <code>{ind.id}</code>, licensed{' '}
          <a href="https://creativecommons.org/licenses/by/4.0/" className={linkCls} rel="license noopener" target="_blank">CC BY 4.0</a>.
          {ind.source ? <> Original source: {ind.source}</> : null} Figures are fetched from the{' '}
          <a href={apiUrl(c, ind)} className={linkCls} rel="noopener" target="_blank">World Bank API</a> and refreshed monthly; see the series on{' '}
          <a href={sourceUrl(c, ind)} className={linkCls} rel="noopener" target="_blank">data.worldbank.org</a>. Comparisons use the same World Bank release.
        </p>
        <p>
          Want to ask your own questions of data like this? <Link href="/demo" className={linkCls}>Try AnalyzeIt</Link>: upload a file or ask about public data in plain words,
          and every figure comes with its working.
        </p>
      </Section>
    </LegalLayout>
  );
}
