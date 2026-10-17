import React from 'react';
import Link from 'next/link';

const LEAKS = [
  {
    title: 'One payment method keeps failing',
    body: 'UPI, a bank, a wallet or cards: failed payments are sales you never see as a number. AnalyzeIt compares failure rates across method and bank and tells you which one is out of line.',
  },
  {
    title: 'A failure rate that jumped on a date',
    body: 'After a release, a bank outage or a gateway change, the rate moves and nobody notices for weeks. AnalyzeIt finds the date it changed and where it happened.',
  },
  {
    title: 'Refunds quietly rising',
    body: 'Refund and cancellation rates by method and over time, with how many rows each figure rests on, so a handful of refunds is not mistaken for a trend.',
  },
];

export const LeaksSection: React.FC = () => (
  <section
    id="leaks"
    className="relative z-10 bg-[var(--bg)] text-[var(--text-primary)] py-20 md:py-28 px-6 md:px-16 scroll-mt-[calc(var(--nav-h,96px)+16px)]"
  >
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="max-w-2xl space-y-4">
        <p className="eyebrow">The problem</p>
        <h2 className="font-serif text-3xl md:text-5xl leading-tight">
          Your total can look fine while{' '}
          <em className="font-serif not-italic text-[var(--accent-text)]">money leaks.</em>
        </h2>
        <p className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed">
          A healthy-looking month can hide a payment method that fails far more than the others. You only find out if you already suspect it and know where to look.
          AnalyzeIt looks everywhere for you, and shows what is out of line.
        </p>
      </div>

      <ul className="grid gap-6 md:grid-cols-3">
        {LEAKS.map((l) => (
          <li key={l.title} className="card-static rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-3 shadow-sm">
            <h3 className="font-serif text-xl text-[var(--text-primary)]">{l.title}</h3>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{l.body}</p>
          </li>
        ))}
      </ul>

      <ol className="grid gap-6 md:grid-cols-3 text-sm leading-relaxed">
        {[
          ['1. Connect', 'Connect your payment provider with a read-only key. AnalyzeIt only reads payments and refunds, and never stores customer email, phone, card or UPI details.'],
          ['2. Ask', 'Ask “what is going wrong with my payments?”. The data is refreshed first if it has not been for a few minutes.'],
          ['3. Check', 'Each finding shows the exact figures and the query behind it, so you can verify it or hand it to your developer.'],
        ].map(([h, b]) => (
          <li key={h} className="space-y-1.5">
            <p className="font-medium text-[var(--text-primary)]">{h}</p>
            <p className="text-[var(--text-secondary)]">{b}</p>
          </li>
        ))}
      </ol>

      <p className="text-sm text-[var(--text-secondary)]">
        Prefer not to connect? Upload any payments or orders file and ask the same question. <Link href="/docs/discovery" className="text-[var(--accent-text)] underline underline-offset-2">How it works</Link>.
      </p>
    </div>
  </section>
);
