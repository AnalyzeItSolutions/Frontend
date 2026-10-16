'use client';

import example from '../../lib/fixtures/hero.example.json';
import { parseFindings } from '../../lib/findings.mjs';
import { FindingCards } from '../research/FindingCards';

/**
 * A real output, not a picture of one: what AnalyzeIt produced for this question on sample data, drawn with the same card the product
 * uses. Nothing here is typed in by hand (the figures come from the saved run), and the caption says plainly that the data is a sample.
 */
export function HeroAnswer() {
  const all = parseFindings(example.findings);
  if (!all) return null;
  // One card up here keeps the headline in view; the other finding is in the saved run and on the product page.
  const parsed = { ...all, findings: all.findings.slice(0, 1) };
  return (
    <figure className="w-full max-w-xl lg:max-w-lg" aria-label="An example answer">
      <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-[var(--text-secondary)]">
        <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-[#0A0A0A]" />What you get
      </p>
      <div className="ml-auto mb-3 w-fit max-w-[90%] rounded-2xl rounded-br-md bg-[#2D2D2D] px-4 py-2 text-sm text-[var(--brand-ink)] shadow-sm dark:bg-[var(--brand)] dark:text-[#121212]">
        {example.question}
      </div>
      <div className="rounded-3xl border border-[#414141]/10 bg-[#F8F8F8]/95 p-4 shadow-sm backdrop-blur-md dark:border-[var(--border)] dark:bg-[#121212]/92 sm:p-5">
        <FindingCards data={parsed} />
      </div>
      <figcaption className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
        This is {example.dataset}. Bring your own data to see yours. Open &ldquo;Show the working&rdquo; on a card for the exact figures and the query behind it.
      </figcaption>
    </figure>
  );
}
