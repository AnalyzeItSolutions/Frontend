import {
  EMAIL,
  GSTIN,
  JURISDICTION,
  LEGAL_NAME,
  PHONE,
  REGISTERED_ADDRESS,
} from '../../lib/legalEntity';

export function OperatorBlock({
  quiet = false,
  updated,
}: {
  quiet?: boolean;
  updated?: string;
}) {
  return (
    <section
      className={
        quiet
          ? 'mt-16 space-y-1 rounded-2xl border border-[var(--border)] bg-white/30 dark:bg-[#1B1B1B]/40 p-5 text-xs text-[var(--text-secondary)]'
          : 'mt-4 space-y-1 rounded-2xl border border-[var(--border)] bg-white/40 dark:bg-[#1B1B1B]/60 p-5 text-sm'
      }
    >
      <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)]">
        Legal entity
      </p>
      <p className={`font-medium text-[var(--text-primary)] ${quiet ? 'text-xs' : ''}`}>
        {LEGAL_NAME}
      </p>
      <p>{REGISTERED_ADDRESS}</p>
      <p>Governing law: {JURISDICTION}</p>
      {GSTIN ? <p>GSTIN: {GSTIN}</p> : null}
      {PHONE ? <p>Phone: {PHONE}</p> : null}
      <p>
        Legal:{' '}
        <a href={`mailto:${EMAIL.legal}`} className="text-brand hover:underline">
          {EMAIL.legal}
        </a>
      </p>
      {updated ? (
        <p className="pt-2 text-[11px] text-[var(--text-muted)]">
          Last updated {updated}
        </p>
      ) : null}
    </section>
  );
}
