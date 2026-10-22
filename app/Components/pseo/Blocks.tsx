import Link from 'next/link';
import { JsonLd } from '../seo/JsonLd';

// Server-rendered building blocks for the /metrics and /methods pages. Everything here is plain HTML in the first response,
// so crawlers and answer engines read the full page without running JavaScript.

const h2 = 'font-serif text-2xl text-[var(--text-primary)]';
export const linkCls = 'text-[var(--text-primary)] underline underline-offset-2';

export function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-3">
      <h2 className={h2}>{title}</h2>
      {children}
    </section>
  );
}

/** The direct answer, first on the page: what answer engines quote. */
export function AnswerBox({ answer, formula, result }: { answer: string; formula?: string; result?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface,transparent)] p-5 space-y-3">
      <p className="text-[15px] sm:text-base text-[var(--text-primary)] leading-relaxed">{answer}</p>
      {formula ? <p className="font-mono text-[13px] text-[var(--text-primary)]">{formula}</p> : null}
      {result ? <p className="text-sm text-[var(--text-secondary)]">{result}</p> : null}
    </div>
  );
}

export function Code({ label, code }: { label?: string; code: string }) {
  return (
    <figure className="space-y-1.5">
      {label ? <figcaption className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">{label}</figcaption> : null}
      <pre className="overflow-x-auto rounded-lg border border-[var(--border)] bg-black/[0.03] dark:bg-white/[0.04] p-4 text-[12.5px] leading-relaxed text-[var(--text-primary)]">
        <code>{code}</code>
      </pre>
    </figure>
  );
}

export function DataTable({ caption, head, rows, numericFrom = 1 }: { caption?: string; head: string[]; rows: (string | number)[][]; numericFrom?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        {caption ? <caption className="mb-2 text-left text-xs text-[var(--text-muted)]">{caption}</caption> : null}
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={h} scope="col" className={`border-b border-[var(--border)] px-2 py-1.5 font-medium text-[var(--text-primary)] ${i >= numericFrom ? 'text-right' : 'text-left'}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((v, i) => (
                <td key={i} className={`border-b border-[var(--border)]/60 px-2 py-1.5 tabular-nums whitespace-nowrap ${i >= numericFrom ? 'text-right' : 'text-left'}`}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Bullets({ items, ordered = false }: { items: React.ReactNode[]; ordered?: boolean }) {
  const cls = `${ordered ? 'list-decimal' : 'list-disc'} space-y-1.5 pl-5`;
  const lis = items.map((t, i) => <li key={i}>{t}</li>);
  return ordered ? <ol className={cls}>{lis}</ol> : <ul className={cls}>{lis}</ul>;
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  return (
    <Section title="Questions people ask">
      <JsonLd data={data} />
      <dl className="space-y-4">
        {items.map((f) => (
          <div key={f.q}>
            <dt className="font-medium text-[var(--text-primary)]">{f.q}</dt>
            <dd className="mt-1">{f.a}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

/** Where the numbers come from. Shown on every generated page. */
export function SourceNote({ dataset, children }: { dataset: string; children?: React.ReactNode }) {
  return (
    <Section title="About the data on this page">
      <p>
        The figures come from a small made-up dataset, printed above in full so you can check every number by hand. Download it as{' '}
        <a href={`/sample-data/${dataset}.csv`} className={linkCls} download>{dataset}.csv</a>. The results are computed from those rows when the page is built,
        and the Excel formulas, SQL and Python on these pages are run against the same rows before publishing, so the code and the answers agree.
      </p>
      {children}
      <p>
        To get these numbers from your own data without writing formulas, <Link href="/demo" className={linkCls}>try AnalyzeIt</Link>: ask in plain words and it shows the
        working behind every figure.
      </p>
    </Section>
  );
}

export function LinkList({ items }: { items: { href: string; label: string; note?: string }[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((i) => (
        <li key={i.href}>
          <Link href={i.href} className={linkCls}>{i.label}</Link>
          {i.note ? <span className="text-[var(--text-muted)]"> — {i.note}</span> : null}
        </li>
      ))}
    </ul>
  );
}
