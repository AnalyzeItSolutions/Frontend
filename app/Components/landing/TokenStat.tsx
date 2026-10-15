import Link from 'next/link';
import { TOKEN_BENCHMARK } from '../../lib/benchmark';

/** The headline number. Shows a plainly labelled placeholder until the benchmark is published. */
export function TokenStat() {
  const { published, reduction, method, reportUrl } = TOKEN_BENCHMARK;
  return (
    <div
      className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
      data-benchmark-published={published ? 'true' : 'false'}
    >
      <p
        className="font-heading text-4xl leading-none tracking-tight text-[var(--accent-text)] tabular-nums"
        aria-label={published ? `${reduction} fewer tokens` : 'Benchmark number pending'}
      >
        {reduction}
      </p>
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium text-[var(--text-primary)]">fewer tokens on long conversations</p>
        {published ? (
          <p className="text-xs text-[var(--text-secondary)]">
            {method}
            {reportUrl ? (
              <>
                {' '}
                <Link href={reportUrl} className="text-[var(--accent-text)] underline underline-offset-2">
                  Read the method
                </Link>
              </>
            ) : null}
          </p>
        ) : (
          <p className="text-xs text-[var(--text-secondary)]">
            <span className="mr-1.5 rounded-full border border-[var(--border-strong)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Placeholder
            </span>
            Not a measured result. We publish the benchmark and its method before quoting a number.
          </p>
        )}
      </div>
    </div>
  );
}
