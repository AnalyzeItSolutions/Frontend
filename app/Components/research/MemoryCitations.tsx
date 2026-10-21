'use client';

import type { MemoryCitation } from '../../lib/memoryCitations.mjs';

/** "From your notes" under an answer: one quiet line that opens to the passages the answer was built from. */
export function MemoryCitations({ citations }: { citations: MemoryCitation[] }) {
  if (!citations.length) return null;
  return (
    <details className="group mt-2 text-[11px]" aria-label="Sources from your notes">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]">
        <span className="font-mono uppercase tracking-wider text-[10px]">From your notes</span>
        <span className="rounded-full bg-[var(--surface-2)] px-1.5 py-0.5">{citations.length}</span>
        <span aria-hidden className="transition-transform group-open:rotate-90">›</span>
      </summary>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {citations.map((c) => (
          <details key={c.key} className="group rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] text-[var(--text-secondary)] open:w-full">
            <summary className="cursor-pointer list-none font-medium transition-colors hover:text-[var(--text-primary)]">
              {c.label}
              <span className="ml-1.5 opacity-50">{c.opened ? 'read in full' : 'matched'}</span>
            </summary>
            {c.excerpt ? <p className="mt-1.5 whitespace-pre-wrap text-[11px] leading-relaxed text-[var(--text-primary)]">{c.excerpt}</p> : null}
          </details>
        ))}
      </div>
    </details>
  );
}
