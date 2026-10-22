import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout } from '../Components/legal/LegalLayout';
import { JsonLd, breadcrumbs } from '../Components/seo/JsonLd';
import { Section, linkCls } from '../Components/pseo/Blocks';
import { COUNTRIES, INDICATORS, WDI_LATEST_YEAR, WDI_MIN_OBS, WDI_PAGES } from '../lib/wdi/wdi';
import { SITE_URL } from '../lib/site';

export const metadata: Metadata = {
  title: 'Country data: World Bank indicators for every economy — AnalyzeIt',
  description: 'GDP, population, inflation, health, education, energy and more for 217 economies and their regions, with yearly history, charts and rankings from the World Bank.',
  alternates: { canonical: '/data' },
};

const POPULAR = ['NY.GDP.MKTP.CD', 'NY.GDP.PCAP.CD', 'NY.GDP.MKTP.KD.ZG', 'FP.CPI.TOTL.ZG', 'SP.POP.TOTL', 'SP.DYN.LE00.IN', 'SL.UEM.TOTL.ZS', 'EN.GHG.CO2.PC.CE.AR5', 'IT.NET.USER.ZS', 'NE.EXP.GNFS.ZS', 'GC.DOD.TOTL.GD.ZS', 'SP.URB.TOTL.IN.ZS'];

export default function Page() {
  const economies = COUNTRIES.filter((c) => !c.aggregate);
  const groups = COUNTRIES.filter((c) => c.aggregate);
  const popular = POPULAR.map((id) => INDICATORS.find((i) => i.id === id)).filter((i): i is NonNullable<typeof i> => !!i);
  return (
    <LegalLayout
      title="Country data, from the source."
      eyebrow={false}
      showHeroUpdated={false}
      quietOperator
      subtitle={`${INDICATORS.length.toLocaleString('en-US')} World Bank indicators for ${economies.length} economies and ${groups.length} regions and income groups: ${WDI_PAGES.toLocaleString('en-US')} pages, each with yearly history to ${WDI_LATEST_YEAR}, a chart and how the country compares.`}
    >
      <JsonLd data={breadcrumbs(SITE_URL, [{ name: 'Home', path: '/' }, { name: 'Data', path: '/data' }])} />
      <p>
        Every figure comes from the World Bank&apos;s World Development Indicators (CC BY 4.0) and is credited on its page. A country gets a page for an indicator only when the
        World Bank has at least {WDI_MIN_OBS} years of data for it, so there are no empty pages. Browse by country below, or by <Link href="/indicators" className={linkCls}>indicator</Link>.
      </p>
      <Section title="Popular indicators">
        <ul className="list-disc space-y-1.5 pl-5">
          {popular.map((i) => <li key={i.id}><Link href={`/indicators/${i.slug}`} className={linkCls}>{i.name}</Link></li>)}
        </ul>
      </Section>
      <Section title="Countries and economies">
        <p className="leading-loose">
          {economies.map((c, i) => <span key={c.iso3}>{i ? ' · ' : ''}<Link href={`/data/${c.slug}`} className={linkCls}>{c.name}</Link></span>)}
        </p>
      </Section>
      <Section title="Regions and income groups">
        <p className="leading-loose">
          {groups.map((c, i) => <span key={c.iso3}>{i ? ' · ' : ''}<Link href={`/data/${c.slug}`} className={linkCls}>{c.name}</Link></span>)}
        </p>
      </Section>
      <p>
        To analyse figures like these together with your own numbers, <Link href="/demo" className={linkCls}>try AnalyzeIt</Link>. For formulas and methods, see{' '}
        <Link href="/metrics" className={linkCls}>business metrics</Link> and <Link href="/methods" className={linkCls}>statistics methods</Link>.
      </p>
    </LegalLayout>
  );
}
