import Link from 'next/link';
import { TOKEN_BENCHMARK } from '../../lib/benchmark';

/** The headline number, from the measured benchmark. Shows a plainly labelled placeholder if the benchmark is ever unpublished. */
export function TokenStat() {
  const { published, reduction, method, reportUrl, rollingOut } = TOKEN_BENCHMARK;
  return (
    <div
      className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
      data-benchmark-published={published ? 'true' : 'false'}
    >
      <p
        className="font-heading text-4xl leading-none tracking-tight text-[var(--accent-text)] tabular-nums"
        aria-label={published ? `${reduction} fewer prompt tokens on long conversations` : 'Benchmark number pending'}
      >
        {reduction}
      </p>
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          fewer prompt tokens on long conversations
          {published && rollingOut ? (
            <span className="ml-2 rounded-full border border-[var(--border-strong)] px-1.5 py-0.5 align-middle text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Rolling out
            </span>
          ) : null}
        </p>
        {published ? (
          <p className="text-xs text-[var(--text-secondary)]">
            {method}
            {reportUrl ? (
              <>
                {' '}
                <Link href={reportUrl} className="text-[var(--accent-text)] underline underline-offset-2">
                  See how it was measured
                </Link>
              </>
            ) : null}
          </p>
        ) : (
          <p className="text-xs text-[var(--text-secondary)]">
            <span className="mr-1.5 rounded-full border border-[var(--border-strong)] px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Placeholder
            </span>
            Not a measured result. We publish the benchmark and its method before quoting a number.
          </p>
        )}
      </div>
    </div>
  );
}
