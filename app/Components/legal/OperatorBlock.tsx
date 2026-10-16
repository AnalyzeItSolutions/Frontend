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
          ? 'mt-16 space-y-1 rounded-2xl border border-[var(--border)] bg-white/30 dark:bg-[#191919]/40 p-5 text-xs text-[#414141]/65 dark:text-[#BABABA]/80'
          : 'mt-4 space-y-1 rounded-2xl border border-[var(--border)] bg-white/40 dark:bg-[#191919]/60 p-5 text-sm'
      }
    >
      <p className="font-mono text-[11px] uppercase tracking-widest text-[#414141]/45 dark:text-[#888888]">
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
        <a href={`mailto:${EMAIL.legal}`} className="text-[#F2F2F2] hover:underline">
          {EMAIL.legal}
        </a>
      </p>
      {updated ? (
        <p className="pt-2 text-[11px] text-[#414141]/45 dark:text-[#888888]">
          Last updated {updated}
        </p>
      ) : null}
    </section>
  );
}
