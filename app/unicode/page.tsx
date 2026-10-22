import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout } from '../Components/legal/LegalLayout';
import { JsonLd, breadcrumbs } from '../Components/seo/JsonLd';
import { Section, linkCls } from '../Components/pseo/Blocks';
import { UnicodeLookup } from '../Components/pseo/UnicodeLookup';
import { uPlus } from '../lib/unicode/encode.mjs';
import { BLOCKS, CHAR_COUNT, UNICODE_VERSION } from '../lib/unicode/unicode';
import { SITE_URL } from '../lib/site';

export const metadata: Metadata = {
  title: 'Unicode character lookup: codes for HTML, UTF-8, CSS, JavaScript and Python — AnalyzeIt',
  description: 'Look up any character or emoji and get its code point, UTF-8 bytes, HTML entity and escapes for CSS, JavaScript, Python, Java, Go and Rust.',
  alternates: { canonical: '/unicode' },
};

export default function Page() {
  const blocks = BLOCKS.filter((b) => b.count);
  return (
    <LegalLayout title="Unicode characters." eyebrow={false} showHeroUpdated={false} quietOperator subtitle={`${CHAR_COUNT.toLocaleString('en-US')} named characters from Unicode ${UNICODE_VERSION}, each with its codes for the web and for programming languages.`}>
      <JsonLd data={breadcrumbs(SITE_URL, [{ name: 'Home', path: '/' }, { name: 'Unicode', path: '/unicode' }])} />
      <UnicodeLookup />
      <Section title="What the codes mean">
        <p>
          A Unicode code point is a number, written U+ followed by hex, that names one character. Files and networks store it as bytes: UTF-8 uses one to four bytes and is what the web
          uses; UTF-16, used inside JavaScript, Java and Windows, uses one or two 16-bit units. HTML can write any character as &amp;#decimal; or &amp;#xhex;, and programming
          languages each have an escape, such as é in JavaScript or \N&#123;LATIN SMALL LETTER E WITH ACUTE&#125; in Python.
        </p>
      </Section>
      <Section title={`All ${blocks.length} blocks`}>
        <ul className="space-y-1">
          {blocks.map((b) => (
            <li key={b.slug}>
              <Link href={`/unicode/blocks/${b.slug}`} className={linkCls}>{b.name}</Link>
              <span className="text-[var(--text-muted)] font-mono text-xs"> {uPlus(b.start)}–{uPlus(b.end)} · {b.count}</span>
            </li>
          ))}
        </ul>
      </Section>
      <p>
        Data: Unicode Character Database {UNICODE_VERSION} (Unicode License v3). Not included: the large ranges whose names are only numbers (CJK ideographs, Hangul syllables,
        Tangut) and private-use code points. More <Link href="/tools" className={linkCls}>developer and data tools</Link>.
      </p>
    </LegalLayout>
  );
}
