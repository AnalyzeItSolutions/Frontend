import type { Metadata } from 'next';
import Link from '../../../Components/pseo/Link';
import { notFound } from 'next/navigation';
import { LegalLayout } from '../../../Components/legal/LegalLayout';
import { JsonLd, breadcrumbs } from '../../../Components/seo/JsonLd';
import { AnswerBox, DataTable, Faq, LinkList, Section, linkCls } from '../../../Components/pseo/Blocks';
import { LineChart } from '../../../Components/pseo/LineChart';
import { lowerFirst, changeSentence, fmtExact, fmtValue, kindOf, ordinal, rankAmong, summarize } from '../../../lib/wdi/describe.mjs';
import { COUNTRIES, apiUrl, cell, cellsFor, country, countryIso3, definition, fetchSeries, indicator, indicatorsFor, sourceUrl } from '../../../lib/wdi/wdi';
import { SITE_NAME, SITE_URL } from '../../../lib/site';
import { GuideList } from '../../../Components/pseo/Related';
import { dataSnippet } from '../../../lib/seo/snippets.mjs';
import { analysisText } from '../../../lib/wdi/analysis.mjs';

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
  // Same ranking rule as the page: economies reporting the same latest year, at least ten of them.
  const sameYear = cellsFor(ind).filter((e) => !e.country.aggregate && e.cell[3] === k[3]).map((e) => ({ value: e.cell[4] }));
  const rank = !c.aggregate && sameYear.length >= 10 ? rankAmong(sameYear, k[4]) : null;
  const { title, description } = dataSnippet({ country: c.name, indicator: ind.name, value: fmtValue(k[4], kindOf(ind.name)), year: k[3], first: k[2], obs: k[1], rank });
  return {
    title,
    description,
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

  const an = analysisText({ country: c.name, name: lower, kind, points: series });
  const hasAnalysis = an.move.length > 0 || an.biggest.length > 0 || an.trend.length > 0;
  // The economies ranked just above and below this one, for the same year: real neighbours, each a page of its own.
  const ranked = sameYear.filter((e) => Number.isFinite(e.value)).sort((a, b) => b.value - a.value);
  const at = ranked.findIndex((e) => e.country.iso3 === c.iso3);
  const closest = !c.aggregate && at >= 0 ? [...ranked.slice(Math.max(0, at - 3), at), ...ranked.slice(at + 1, at + 4)] : [];

  const faq = [
    { q: `What is ${c.name}'s ${lower}?`, a: `${fmtValue(s.latest.value, kind)} in ${s.latest.year}, according to the World Bank (World Development Indicators).` },
    ...(since ? [{ q: `How has it changed since ${s.first.year}?`, a: `It is ${since}. The highest value was ${fmtValue(s.max.value, kind)} in ${s.max.year} and the lowest ${fmtValue(s.min.value, kind)} in ${s.min.year}.` }] : []),
    ...(rank ? [{ q: `How does ${c.name} rank?`, a: `${ordinal(rank.rank)} highest of ${rank.of} economies with data for ${s.latest.year}.` }] : []),
    ...(an.move.length ? [{ q: `Is the latest change in ${lower} unusual for ${c.name}?`, a: an.move.join(' ') }] : []),
    ...(an.projection.length ? [{ q: `Where is ${c.name}'s ${lower} heading?`, a: `${an.trend.join(' ')} ${an.projection.join(' ')}` }] : []),
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

      {hasAnalysis ? (
        <Section title="What the numbers say">
          {an.move.map((t) => <p key={t}>{t}</p>)}
          {an.biggest.map((t) => <p key={t}>{t}</p>)}
          {an.trend.map((t) => <p key={t}>{t}</p>)}
          <p className="text-xs text-[var(--text-muted)]">
            Worked out from the yearly values above. How the checks work: <Link href="/methods/standard-deviation" className={linkCls}>standard deviation</Link>,{' '}
            <Link href="/methods/z-score" className={linkCls}>z-scores</Link> and <Link href="/methods/linear-regression" className={linkCls}>straight-line trends</Link>.
          </p>
        </Section>
      ) : null}

      {an.projection.length ? (
        <Section title="A straight-line projection, tested first">
          {an.projection.map((t) => <p key={t}>{t}</p>)}
          <p className="text-xs text-[var(--text-muted)]">
            See <Link href="/methods/linear-trend-forecast" className={linkCls}>how a linear trend forecast works</Link> and the guide on{' '}
            <Link href="/guides/forecast-without-fooling-yourself" className={linkCls}>forecasting without fooling yourself</Link>.
          </p>
        </Section>
      ) : null}

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

      {closest.length ? (
        <Section title={`Closest to ${c.name} in the ${s.latest.year} ranking`}>
          <LinkList items={closest.map((e) => ({ href: `/data/${e.country.slug}/${ind.slug}`, label: e.country.name, note: `${ordinal(ranked.indexOf(e) + 1)} of ${ranked.length}: ${fmtValue(e.value, kind)}` }))} />
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

      <GuideList slugs={['free-public-datasets-and-how-to-check-them', 'data-analysis-examples', 'real-change-or-random-noise']} title="Reading data like this" />

      <Faq items={faq} />

      <Section title="Source">
        <p>
          World Bank, World Development Indicators, indicator <code>{ind.id}</code>, licensed{' '}
          <a href="https://creativecommons.org/licenses/by/4.0/" className={linkCls} rel="license noopener" target="_blank">CC BY 4.0</a>.
          {ind.source ? <> Original source: {ind.source}</> : null} Figures are fetched from the{' '}
          <a href={apiUrl(c, ind)} className={linkCls} rel="noopener" target="_blank">World Bank API</a> and refreshed monthly; see the series on{' '}
          <a href={sourceUrl(c, ind)} className={linkCls} rel="noopener" target="_blank">data.worldbank.org</a>. The full definition and method are in the World Bank's{' '}
          <a href={`https://databank.worldbank.org/metadataglossary/world-development-indicators/series/${ind.id}`} className={linkCls} rel="noopener" target="_blank">metadata glossary</a>. Comparisons use the same World Bank release.
        </p>
        <p>
          Want to ask your own questions of data like this? <Link href="/demo" className={linkCls}>Try AnalyzeIt</Link>: upload a file or ask about public data in plain words,
          and every figure comes with its working.
        </p>
      </Section>
    </LegalLayout>
  );
}
