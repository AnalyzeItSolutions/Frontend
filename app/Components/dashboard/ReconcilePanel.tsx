'use client';

import { useState } from 'react';
import { reconcileSummary } from '../../lib/goalsView.mjs';
import { reconcilePayments, type ReconcileResult } from '../../lib/goalsApi';

/** Payments and refunds that do not add up. Runs on demand; reads only what has already been synced. */
export function ReconcilePanel({ projectId }: { projectId: string }) {
  const [result, setResult] = useState<ReconcileResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    setBusy(true);
    setError('');
    try {
      setResult(await reconcilePayments(projectId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not check the books.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label="Payment check" className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)]">Payment check</h3>
          <p className="text-xs text-[var(--text-muted)]">Finds refunds beyond what was paid, orders paid twice, and refunds that do not match their payment.</p>
        </div>
        <button type="button" disabled={busy} onClick={() => void run()} className="btn-primary text-xs disabled:opacity-50">{busy ? 'Checking…' : 'Check now'}</button>
      </div>
      {error ? <p role="alert" className="text-xs text-[var(--danger)]">{error}</p> : null}
      {result ? (
        <>
          <p role="status" className="text-xs text-[var(--text-muted)]">{reconcileSummary(result)}</p>
          <ul className="divide-y divide-[var(--border)] text-sm">
            {result.findings.map((f) => (
              <li key={f.kind} className="space-y-0.5 py-2">
                <span className="font-medium text-[var(--text-primary)]">
                  <span aria-hidden className={`mr-2 inline-block h-2 w-2 rounded-full ${f.severity === 'high' ? 'bg-[var(--danger)]' : 'bg-[var(--coral)]'}`} />
                  {f.title}
                </span>
                <p className="text-xs text-[var(--text-secondary)]">{f.detail}</p>
                <p className="break-all text-xs text-[var(--text-muted)]">{f.payment_ids.join(', ')}{f.count > f.payment_ids.length ? ` and ${f.count - f.payment_ids.length} more` : ''}</p>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
