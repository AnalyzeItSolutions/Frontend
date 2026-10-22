import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LegalLayout } from '../../Components/legal/LegalLayout';
import { JsonLd, breadcrumbs } from '../../Components/seo/JsonLd';
import { AnswerBox, DataTable, Faq, LinkList, Section, linkCls } from '../../Components/pseo/Blocks';
import { UnitConverter } from '../../Components/pseo/UnitConverter';
import { PAIRS, convert, factorOf, formula, nice, pair, tableInputs } from '../../lib/convert/units.mjs';
import { SITE_NAME, SITE_URL } from '../../lib/site';

export const dynamicParams = false;
export function generateStaticParams() {
  return PAIRS.map((p) => ({ pair: p.slug }));
}

type Params = Promise<{ pair: string }>;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = pair((await params).pair);
  if (!p) return {};
  const one = nice(convert(p, 1));
  return {
    title: `${cap(p.from.plural)} to ${p.to.plural} (${p.from.symbol} to ${p.to.symbol}): converter and formula — ${SITE_NAME}`,
    description: `1 ${p.from.name} = ${one} ${one === '1' ? p.to.name : p.to.plural}. Convert ${p.from.plural} to ${p.to.plural} with the exact formula, a calculator and a conversion table.`.slice(0, 160),
    alternates: { canonical: `/convert/${p.slug}` },
  };
}

export default async function Page({ params }: { params: Params }) {
  const p = pair((await params).pair);
  if (!p) notFound();
  const k = factorOf(p);
  const one = nice(convert(p, 1));
  const back = pair(`${p.to.id}-to-${p.from.id}`)!;
  const example = p.category.affine ? 25 : tableInputs(p)[4];
  const answer = p.category.affine
    ? `To convert ${p.from.plural} to ${p.to.plural}, use ${formula(p)}. For example, ${nice(example)} ${p.from.symbol} = ${nice(convert(p, example))} ${p.to.symbol}.`
    : `1 ${p.from.name} (${p.from.symbol}) = ${one} ${one === '1' ? p.to.name : p.to.plural} (${p.to.symbol}). To convert, ${k! >= 1 ? `multiply by ${nice(k!)}` : `divide by ${nice(1 / k!)}`}: ${formula(p)}. For example, ${nice(example)} ${p.from.symbol} = ${nice(convert(p, example))} ${p.to.symbol}.`;
  const fromHere = p.category.units.filter((u) => u.id !== p.from.id && u.id !== p.to.id).map((u) => pair(`${p.from.id}-to-${u.id}`)!);
  const toHere = p.category.units.filter((u) => u.id !== p.from.id && u.id !== p.to.id).map((u) => pair(`${u.id}-to-${p.to.id}`)!);
  const exact = !p.category.affine && /^[\d.]+$/.test(nice(k!).replace(/,/g, '')) && Number(nice(k!).replace(/,/g, '')) === k;
  const faq = [
    { q: `How many ${p.to.plural} are in a ${p.from.name}?`, a: p.category.affine ? `${formula(p)}, so 0 ${p.from.symbol} = ${nice(convert(p, 0))} ${p.to.symbol}.` : `${one}${exact ? ', exactly' : ''}.` },
    { q: `How do you convert ${p.from.plural} to ${p.to.plural}?`, a: `${formula(p)}. ${p.category.affine ? 'Temperature scales have different zero points, so a plain multiplication does not work.' : `It is the same as dividing by ${nice(1 / k!)}.`}` },
    { q: `How do you convert ${p.to.plural} back to ${p.from.plural}?`, a: `${formula(back)}. See ${back.from.plural} to ${back.to.plural}.` },
  ];
  return (
    <LegalLayout title={`${cap(p.from.plural)} to ${p.to.plural}`} eyebrow={`${p.category.name} · ${p.from.symbol} → ${p.to.symbol}`} showHeroUpdated={false} quietOperator subtitle={`Convert ${p.from.symbol} to ${p.to.symbol} with the exact formula, a two-way calculator and a table.`}>
      <JsonLd data={breadcrumbs(SITE_URL, [{ name: 'Home', path: '/' }, { name: 'Convert', path: '/convert' }, { name: `${cap(p.from.plural)} to ${p.to.plural}`, path: `/convert/${p.slug}` }])} />
      <AnswerBox answer={answer} formula={formula(p)} />
      <UnitConverter slug={p.slug} start={p.category.affine ? 25 : 1} />
      <Section title={`${cap(p.from.plural)} to ${p.to.plural} table`}>
        <DataTable head={[`${cap(p.from.plural)} (${p.from.symbol})`, `${cap(p.to.plural)} (${p.to.symbol})`]} numericFrom={0} rows={tableInputs(p).map((v) => [nice(v), nice(convert(p, v))])} />
      </Section>
      <Section title="The two units">
        <p><strong>{cap(p.from.name)} ({p.from.symbol}).</strong> {p.from.def}</p>
        <p><strong>{cap(p.to.name)} ({p.to.symbol}).</strong> {p.to.def}</p>
        {exact ? <p>Because both units are defined in terms of the same base unit, the factor {nice(k!)} is exact, not a rounded measurement.</p> : null}
      </Section>
      <Section title={`Convert ${p.from.plural} to other units`}>
        <LinkList items={fromHere.map((x) => ({ href: `/convert/${x.slug}`, label: `${cap(x.from.plural)} to ${x.to.plural}`, note: x.category.affine ? undefined : `1 ${x.from.symbol} = ${nice(convert(x, 1))} ${x.to.symbol}` }))} />
      </Section>
      <Section title={`Convert other units to ${p.to.plural}`}>
        <LinkList items={[back, ...toHere].map((x) => ({ href: `/convert/${x.slug}`, label: `${cap(x.from.plural)} to ${x.to.plural}` }))} />
      </Section>
      <Faq items={faq} />
      <p>
        Results use the legal definitions of each unit and are checked against the Pint unit library. Display rounds to 10 significant digits.{' '}
        <Link href="/convert" className={linkCls}>All unit conversions</Link> · <Link href="/tools" className={linkCls}>More tools</Link>
      </p>
    </LegalLayout>
  );
}
