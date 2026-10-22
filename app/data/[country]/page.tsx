import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LegalLayout } from '../../Components/legal/LegalLayout';
import { JsonLd, breadcrumbs } from '../../Components/seo/JsonLd';
import { Section, linkCls } from '../../Components/pseo/Blocks';
import { fmtValue, kindOf } from '../../lib/wdi/describe.mjs';
import { COUNTRIES, TOPICS, country, countryIso3, indicatorsFor } from '../../lib/wdi/wdi';
import { SITE_NAME, SITE_URL } from '../../lib/site';

export const revalidate = 2592000;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type Params = Promise<{ country: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const c = country((await params).country);
  if (!c) return {};
  const n = indicatorsFor(c).length;
  return {
    title: `${c.name} data: ${n} economic and social indicators — ${SITE_NAME}`,
    description: `Latest World Bank figures for ${c.name}: GDP, population, health, education, environment, trade and more, ${n} indicators with yearly history.`.slice(0, 160),
    alternates: { canonical: `/data/${c.slug}` },
  };
}

export default async function Page({ params }: { params: Params }) {
  const c = country((await params).country);
  if (!c) notFound();
  const items = indicatorsFor(c);
  const region = countryIso3(c.region);
  const peers = COUNTRIES.filter((x) => !x.aggregate && x.region && x.region === c.region && x.iso3 !== c.iso3);
  return (
    <LegalLayout title={`${c.name}: data`} eyebrow={c.aggregate ? 'Region or group' : [region?.name, c.income].filter(Boolean).join(' · ')} showHeroUpdated={false} quietOperator subtitle={`${items.length} indicators from the World Bank's World Development Indicators, each with its yearly history, a chart and how ${c.name} compares.`}>
      <JsonLd data={breadcrumbs(SITE_URL, [{ name: 'Home', path: '/' }, { name: 'Data', path: '/data' }, { name: c.name, path: `/data/${c.slug}` }])} />
      <p>
        Latest available value for each indicator, with the year it refers to. Years differ because countries report on different schedules. Source: World Bank,
        World Development Indicators (CC BY 4.0).
      </p>
      {TOPICS.map((t) => {
        const list = items.filter((x) => x.indicator.topic === t);
        if (!list.length) return null;
        return (
          <Section key={t} id={t.toLowerCase().replace(/[^a-z]+/g, '-')} title={`${t} (${list.length})`}>
            <ul className="space-y-1">
              {list.map((x) => (
                <li key={x.indicator.id}>
                  <Link href={`/data/${c.slug}/${x.indicator.slug}`} className={linkCls}>{x.indicator.name}</Link>
                  <span className="text-[var(--text-muted)]"> — {fmtValue(x.cell[4], kindOf(x.indicator.name))} ({x.cell[3]})</span>
                </li>
              ))}
            </ul>
          </Section>
        );
      })}
      {peers.length ? (
        <Section title={`Other economies in ${region?.name ?? 'the region'}`}>
          <p className="leading-loose">
            {peers.map((x, i) => (
              <span key={x.iso3}>{i ? ' · ' : ''}<Link href={`/data/${x.slug}`} className={linkCls}>{x.name}</Link></span>
            ))}
          </p>
        </Section>
      ) : null}
      <p>
        <Link href="/data" className={linkCls}>All countries and regions</Link> · <Link href="/indicators" className={linkCls}>All indicators</Link>
      </p>
    </LegalLayout>
  );
}
