import type { Metadata } from 'next';
import Link from '../../Components/pseo/Link';
import { notFound, permanentRedirect } from 'next/navigation';
import { LegalLayout } from '../../Components/legal/LegalLayout';
import { JsonLd, breadcrumbs } from '../../Components/seo/JsonLd';
import { unicodeSnippet } from '../../lib/seo/snippets.mjs';
import { AnswerBox, DataTable, Faq, LinkList, Section, linkCls } from '../../Components/pseo/Blocks';
import { CopyButton } from '../../Components/pseo/CopyButton';
import { BIDI, GENERAL_CATEGORY, codes, decomposition, isVisible, scriptName, uPlus, utf8 } from '../../lib/unicode/encode.mjs';
import { UNICODE_VERSION, blockOf, charAt, charFromSlug, charPath, charsIn, displayName, glyph, type Char } from '../../lib/unicode/unicode';
import { SITE_URL } from '../../lib/site';

// ~34k pages, rendered from the bundled Unicode index and cached at the CDN (Cache-Control in next.config.ts), not stored as ISR pages.
export const dynamic = 'force-dynamic';

type Params = Promise<{ slug: string }>;

const shown = (c: Char) => (isVisible(c.gc) ? glyph(c) : '');
const ref = (cp: number) => {
  const c = charAt(cp);
  return c ? { href: charPath(c), label: `${shown(c) ? `${shown(c)} ` : ''}${uPlus(cp)} ${displayName(c)}` } : null;
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const c = charFromSlug((await params).slug);
  if (!c) return {};
  const bytes = utf8(c.cp).map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
  // A named entity (&rarr;) is what people search for; the numeric reference otherwise.
  const html = c.entities?.length ? `&${c.entities[0].replace(/^&|;$/g, '')};` : `&#${c.cp};`;
  const { title, description } = unicodeSnippet({ glyph: shown(c), name: displayName(c), uplus: uPlus(c.cp), html, bytes, emoji: !!c.emoji });
  return {
    title,
    description,
    alternates: { canonical: charPath(c) },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;
  const c = charFromSlug(slug);
  if (!c) notFound();
  if (slug !== c.slug) permanentRedirect(charPath(c));
  const b = blockOf(c);
  const g = shown(c);
  const name = displayName(c);
  const u8 = utf8(c.cp).map((x) => x.toString(16).toUpperCase().padStart(2, '0'));
  const dec = decomposition(c.decomp);
  const table = codes(c.cp, { entities: c.entities, name: c.name });
  const html = c.entities?.[0] ?? `&#${c.cp};`;
  const cat = GENERAL_CATEGORY[c.gc] ?? c.gc;
  const answer = `${g ? `${g} is` : 'This is'} the Unicode ${c.emoji ? 'emoji' : 'character'} ${c.name}${c.emoji && c.emoji.toUpperCase() !== c.name ? ` (“${c.emoji}”)` : ''}, code point ${uPlus(c.cp)} (decimal ${c.cp})${b ? ` in the ${b.name} block` : ''}${c.age ? `, added in Unicode ${c.age}` : ''}. In HTML write ${html}, and in UTF-8 it is ${u8.length === 1 ? 'the single byte' : `the ${u8.length} bytes`} ${u8.join(' ')}.`;

  const inBlock = b ? charsIn(b) : [];
  const i = inBlock.findIndex((x) => x.cp === c.cp);
  const near = inBlock.slice(Math.max(0, i - 8), i + 9).filter((x) => x.cp !== c.cp);
  const caseLinks = [c.upper != null ? ['Uppercase', c.upper] : null, c.lower != null ? ['Lowercase', c.lower] : null, c.title != null && c.title !== c.upper ? ['Titlecase', c.title] : null].filter((x): x is [string, number] => !!x);

  const props: [string, string][] = [
    ['Name', c.name],
    ...(c.alias ? [['Also known as', c.alias] as [string, string]] : []),
    ...(c.emoji ? [['Emoji name', c.emoji] as [string, string]] : []),
    ['Code point', `${uPlus(c.cp)} (decimal ${c.cp})`],
    ['Block', b ? `${b.name} (${uPlus(b.start)}–${uPlus(b.end)})` : '—'],
    ['General category', `${c.gc}: ${cat}`],
    ...(c.script ? [['Script', scriptName(c.script)!] as [string, string]] : []),
    ['Bidirectional class', `${c.bidi}: ${BIDI[c.bidi] ?? c.bidi}`],
    ...(c.ccc ? [['Combining class', String(c.ccc)] as [string, string]] : []),
    ...(c.numeric ? [['Numeric value', c.numeric] as [string, string]] : []),
    ['Mirrored in right-to-left text', c.mirrored ? 'Yes' : 'No'],
    ...(c.age ? [['First in Unicode version', c.age] as [string, string]] : []),
  ];

  const faq = [
    { q: `What is the HTML code for ${g || c.name}?`, a: `${c.entities?.length ? `Use the named entity ${c.entities[0]}, or ` : 'Use '}&#${c.cp}; (decimal) or &#x${c.cp.toString(16).toUpperCase()}; (hex).` },
    { q: `What is the UTF-8 encoding of ${uPlus(c.cp)}?`, a: `${u8.join(' ')} (hex), ${u8.length} byte${u8.length > 1 ? 's' : ''}. In a URL it is ${u8.map((x) => `%${x}`).join('')}.` },
    { q: `How do I write ${uPlus(c.cp)} in JavaScript or Python?`, a: `JavaScript: ${table.find((r) => r[0] === 'JavaScript')![1]}. Python: ${table.find((r) => r[0] === 'Python')![1]}.` },
  ];

  return (
    <LegalLayout title={`${g ? `${g} ` : ''}${name}`} eyebrow={`${uPlus(c.cp)}${b ? ` · ${b.name}` : ''}`} showHeroUpdated={false} quietOperator subtitle={`${cat}${c.script && c.script !== 'Common' ? `, ${scriptName(c.script)} script` : ''}. Codes for HTML, CSS, JavaScript, Python and other languages.`}>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'DefinedTerm', name: c.name, alternateName: [uPlus(c.cp), ...(c.emoji ? [c.emoji] : [])], description: answer, url: `${SITE_URL}${charPath(c)}`, inDefinedTermSet: { '@type': 'DefinedTermSet', name: `Unicode ${UNICODE_VERSION}`, url: `${SITE_URL}/unicode` } }} />
      <JsonLd data={breadcrumbs(SITE_URL, [{ name: 'Home', path: '/' }, { name: 'Unicode', path: '/unicode' }, ...(b ? [{ name: b.name, path: `/unicode/blocks/${b.slug}` }] : []), { name: c.name, path: charPath(c) }])} />

      {g ? (
        <div className="flex items-center gap-5">
          <span className="font-serif text-7xl leading-none text-[var(--text-primary)]" lang="und">{g}</span>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={g} label="Copy character" />
            <CopyButton text={html} label={`Copy ${html}`} />
            <CopyButton text={uPlus(c.cp)} label={`Copy ${uPlus(c.cp)}`} />
          </div>
        </div>
      ) : null}

      <AnswerBox answer={answer} />

      <Section title="Codes">
        <DataTable head={['Where', 'How to write it']} rows={table} />
        <p>
          JavaScript and JSON strings store text as UTF-16, so {c.cp >= 0x10000 ? `this character takes two code units (a surrogate pair) and "${g || 'x'}".length is 2` : 'this character is one code unit long'}.
          {' '}Python 3 strings count code points, so its length there is 1.
        </p>
      </Section>

      <Section title="Properties">
        <DataTable head={['Property', 'Value']} rows={props} />
      </Section>

      {dec ? (
        <Section title="Decomposition">
          <p>
            {dec.canonical
              ? `${c.name} is canonically equivalent to the sequence below. Normalising text to NFD splits it into these parts; NFC joins them back into ${uPlus(c.cp)}. Search and comparison should normalise first, or the two spellings will not match.`
              : `${c.name} has a compatibility decomposition (${dec.tag}) to the sequence below. NFKC and NFKD normalisation replace it with that sequence, which can change how text looks, so use them for search, not for storage.`}
          </p>
          <LinkList items={dec.cps.map((cp) => ref(cp) ?? { href: '/unicode', label: uPlus(cp) })} />
        </Section>
      ) : null}

      {caseLinks.length ? (
        <Section title="Upper and lower case">
          <LinkList items={caseLinks.map(([label, cp]) => ({ ...(ref(cp) ?? { href: '/unicode', label: uPlus(cp) }), note: label }))} />
        </Section>
      ) : null}

      {near.length ? (
        <Section title={`Nearby in ${b!.name}`}>
          <LinkList items={near.map((x) => ({ href: charPath(x), label: `${shown(x) ? `${shown(x)} ` : ''}${uPlus(x.cp)} ${displayName(x)}` }))} />
          <p>
            All {b!.count} characters: <Link href={`/unicode/blocks/${b!.slug}`} className={linkCls}>{b!.name}</Link>.
          </p>
        </Section>
      ) : null}

      <Faq items={faq} />

      <Section title="Source">
        <p>
          Unicode Character Database {UNICODE_VERSION} (Unicode License v3){c.emoji ? ' and the Unicode emoji test data' : ''}; HTML entity names from the WHATWG HTML Standard (CC BY 4.0).
          The encodings above are computed from the code point and checked against Python&apos;s encoders. How the character looks depends on your fonts.
        </p>
        <p>
          <Link href="/unicode" className={linkCls}>Look up another character</Link> · <Link href="/tools" className={linkCls}>More developer tools</Link>
        </p>
      </Section>
    </LegalLayout>
  );
}
