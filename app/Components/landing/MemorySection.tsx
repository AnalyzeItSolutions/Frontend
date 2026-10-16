import React from 'react';
import Link from 'next/link';
import { TOKEN_BENCHMARK } from '../../lib/benchmark';
import { PLAN_NAMES } from '../../lib/planCatalog.mjs';
import { CONTEXT_RETENTION_TOKENS, RETENTION_HOT_TOKENS, formatContextRetention } from '../../lib/contextWall.mjs';

const POINTS = [
  {
    title: 'Fewer tokens per question',
    body: 'Each question carries the last two turns and only the earlier turns that match it, as short excerpts. The rest of the conversation stays out of the prompt instead of being replayed every time.',
  },
  {
    title: 'More memory than a prompt can hold',
    body: 'Files, figures and decisions are kept outside the prompt and found again by meaning and by exact words. A question about turn 12 of 1,000 still reaches turn 12.',
  },
  {
    title: 'You can check it',
    body: 'Every answer shows which memories and which query it used. You can see, rename and delete what is kept.',
  },
];

const f = formatContextRetention;

/** Real figures from the published benchmark; bar widths are the measured ratio of the two prompt totals. */
function Measured() {
  const b = TOKEN_BENCHMARK;
  const rows = [
    { label: 'Before: replay the last 8 messages whole', value: `${b.figures.promptBefore} tokens`, width: '100%', tone: 'bg-[var(--surface-muted)]' },
    { label: 'Now: last 2 turns + matching earlier turns', value: `${b.figures.promptAfter} tokens`, width: `${Math.round((34697 / 118657) * 100)}%`, tone: 'bg-[var(--brand)]' },
  ];
  return (
    <figure className="space-y-5" aria-label="Measured prompt size on a 60-turn conversation">
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.label} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs font-medium text-[var(--text-secondary)]">{row.label}</p>
              <p className="text-xs tabular-nums text-[var(--text-muted)]">{row.value}</p>
            </div>
            <div className="h-3 rounded-full bg-[var(--surface-muted)]/60">
              <div className={`h-3 rounded-full ${row.tone}`} style={{ width: row.width }} />
            </div>
          </div>
        ))}
      </div>
      <dl className="grid grid-cols-3 gap-3 border-t border-[var(--border)] pt-4 text-center">
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Prompt</dt>
          <dd className="font-heading text-2xl tabular-nums text-[var(--accent-text)]">−{b.reduction}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Model cost</dt>
          <dd className="font-heading text-2xl tabular-nums text-[var(--accent-text)]">−{b.figures.costReduction}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Old-turn answers</dt>
          <dd className="font-heading text-2xl tabular-nums text-[var(--accent-text)]">{b.figures.oldTurnAfter}</dd>
          <dd className="text-[11px] text-[var(--text-muted)]">was {b.figures.oldTurnBefore}</dd>
        </div>
      </dl>
      <figcaption className="text-xs leading-relaxed text-[var(--text-muted)]">
        Measured {b.measured} on a generated 60-turn conversation, 24 questions, real model calls. A saving that large applies to long
        conversations; on a single question about attached data the difference is small.{' '}
        <Link href={b.reportUrl ?? '/docs/tokens'} className="text-[var(--accent-text)] underline underline-offset-2">
          Method, numbers and limits
        </Link>
        .
      </figcaption>
    </figure>
  );
}

export const MemorySection: React.FC = () => (
  <section
    id="memory"
    className="relative z-10 bg-[var(--bg)] text-[var(--text-primary)] py-20 md:py-28 px-5 sm:px-8 md:px-16 scroll-mt-[calc(var(--nav-h,96px)+16px)] pointer-events-auto"
  >
    <div className="max-w-6xl mx-auto grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
      <div className="space-y-6">
        <p className="text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]">Fewer tokens, more memory</p>
        <h2 className="font-heading text-3xl md:text-5xl leading-tight">
          A memory that feels like{' '}
          <em className="font-heading italic text-[var(--accent-text)]">a bigger context window.</em>
        </h2>
        <ul className="space-y-5">
          {POINTS.map((p) => (
            <li key={p.title} className="space-y-1">
              <h3 className="font-heading text-xl">{p.title}</h3>
              <p className="text-sm md:text-base leading-relaxed text-[var(--text-secondary)]">{p.body}</p>
            </li>
          ))}
        </ul>
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          Memory you can keep: {PLAN_NAMES.free} {f(CONTEXT_RETENTION_TOKENS.free)}, {PLAN_NAMES.premium} {f(CONTEXT_RETENTION_TOKENS.premium)},{' '}
          {PLAN_NAMES.premium_plus} {f(CONTEXT_RETENTION_TOKENS.premium_plus)}. Of that, about {f(RETENTION_HOT_TOKENS.premium)} (
          {PLAN_NAMES.premium}) or {f(RETENTION_HOT_TOKENS.premium_plus)} ({PLAN_NAMES.premium_plus}) is searched by meaning at once; the rest
          is reached through summaries and exact words.{' '}
          <Link href="/docs/memory" className="text-[var(--accent-text)] underline underline-offset-2">How memory works</Link>
        </p>
      </div>
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-[var(--shadow-md)]">
        <Measured />
      </div>
    </div>
  </section>
);
