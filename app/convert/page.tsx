import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout } from '../Components/legal/LegalLayout';
import { JsonLd, breadcrumbs } from '../Components/seo/JsonLd';
import { Section, linkCls } from '../Components/pseo/Blocks';
import { CATEGORIES, PAIRS } from '../lib/convert/units.mjs';
import { SITE_URL } from '../lib/site';

export const metadata: Metadata = {
  title: 'Unit converter: length, weight, volume, temperature, data and more — AnalyzeIt',
  description: 'Exact unit conversions with formulas, a two-way calculator and tables: length, weight, volume, area, temperature, speed, time, data size, energy and pressure.',
  alternates: { canonical: '/convert' },
};

export default function Page() {
  return (
    <LegalLayout title="Unit conversions." eyebrow={false} showHeroUpdated={false} quietOperator subtitle={`${PAIRS.length} conversions across ${CATEGORIES.length} kinds of measurement, each from the unit's legal definition and checked against an independent unit library.`}>
      <JsonLd data={breadcrumbs(SITE_URL, [{ name: 'Home', path: '/' }, { name: 'Convert', path: '/convert' }])} />
      {CATEGORIES.map((c) => (
        <Section key={c.slug} id={c.slug} title={c.name}>
          {c.units.map((u) => (
            <p key={u.id} className="leading-relaxed">
              <strong className="text-[var(--text-primary)]">{u.plural} to:</strong>{' '}
              {c.units.filter((v) => v.id !== u.id).map((v, i) => (
                <span key={v.id}>{i ? ', ' : ''}<Link href={`/convert/${u.id}-to-${v.id}`} className={linkCls}>{v.symbol}</Link></span>
              ))}
            </p>
          ))}
        </Section>
      ))}
    </LegalLayout>
  );
}
