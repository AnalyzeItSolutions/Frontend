'use client';

import { useCallback, useEffect, useState } from 'react';
import { capProblem, invoiceLine, paygStatusLine, rateLine, usd } from '../../lib/paygView.mjs';
import { getPayg, savePayg, type PaygState } from '../../lib/paygApi';

/** Pay as you go: use the model beyond the Free limits and pay after the month, up to a cap the person sets. */
export function PaygPanel({ onChange }: { onChange?: () => void }) {
  const [state, setState] = useState<PaygState | null>(null);
  const [cap, setCap] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const s = await getPayg();
      setState(s);
      setCap(String(s.cap_usd));
    } catch {
      setState(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!state) return null;

  const apply = async (body: { enabled?: boolean; cap_usd?: number }) => {
    setBusy(true);
    setMessage('');
    try {
      const s = await savePayg(body);
      setState(s);
      setCap(String(s.cap_usd));
      onChange?.();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  const problem = capProblem(cap, state);
  const changed = Number(cap) !== state.cap_usd;

  return (
    <section aria-label="Pay as you go" className="app-card space-y-3 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl text-[var(--text,#2D2D2D)]">Pay as you go</h2>
          <p className="text-xs text-[var(--text-muted)]" role="status">
            {paygStatusLine(state)}
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={state.enabled} disabled={busy || state.suspended} onChange={(e) => void apply({ enabled: e.target.checked })} />
          On
        </label>
      </div>
      <p className="text-xs text-[var(--text-secondary)]">{rateLine(state)} No card is stored: you get an invoice by email after the month and pay it with the link.</p>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <label htmlFor="payg-cap" className="text-xs text-[var(--text-muted)]">
          Monthly cap (USD)
        </label>
        <input id="payg-cap" inputMode="decimal" value={cap} onChange={(e) => setCap(e.target.value)} className="w-24 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs" />
        <button type="button" disabled={busy || !!problem || !changed} onClick={() => void apply({ cap_usd: Number(cap) })} className="btn-secondary text-xs disabled:opacity-50">
          Save cap
        </button>
        <span className="text-xs text-[var(--text-muted)]">Up to {usd(state.max_cap_usd)} for now; it rises as you pay invoices.</span>
      </div>
      {changed && problem ? <p className="text-xs text-[var(--danger)]">{problem}</p> : null}
      {message ? <p role="alert" className="text-xs text-[var(--danger)]">{message}</p> : null}
      {state.unbilled_previous_usd > 0 ? (
        <p className="text-xs text-[var(--text-muted)]">{usd(state.unbilled_previous_usd)} from earlier months will be invoiced once it passes {usd(state.invoice_minimum_usd)}.</p>
      ) : null}
      {state.invoices.length ? (
        <ul className="divide-y divide-[var(--border)] text-sm">
          {state.invoices.map((inv) => (
            <li key={inv.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
              <span>{invoiceLine(inv)}</span>
              {inv.pay_url ? (
                <a href={inv.pay_url} target="_blank" rel="noopener noreferrer" className="text-[var(--finding-accent)] underline underline-offset-2">
                  Pay now
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
