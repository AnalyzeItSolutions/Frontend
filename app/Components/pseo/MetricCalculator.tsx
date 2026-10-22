'use client';

import { useMemo, useState } from 'react';
import { evaluate, fmt } from '../../lib/pseo/expr.mjs';

type Input = { key: string; label: string; value: number };

/**
 * A calculator for one metric. The page passes the expression and starting values (the sample totals), so the calculator
 * uses the same arithmetic as the worked example. Growth metrics pass kind 'growth' or 'cmgr' with first/last/steps inputs.
 */
export function MetricCalculator({ name, unit, expr, scale = 1, kind, inputs }: { name: string; unit: string; expr?: unknown; scale?: number; kind?: string; inputs: Input[] }) {
  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries(inputs.map((i) => [i.key, String(i.value)])));
  const num = (k: string) => Number(String(vals[k] ?? '').replace(/,/g, ''));
  const result = useMemo(() => {
    if (inputs.some((i) => !Number.isFinite(num(i.key)) || String(vals[i.key]).trim() === '')) return NaN;
    if (kind === 'growth') return ((num('last') - num('first')) / num('first')) * 100;
    if (kind === 'cmgr') return (Math.pow(num('last') / num('first'), 1 / num('steps')) - 1) * 100;
    return evaluate(expr as never, (c: string) => num(c)) * scale;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vals]);
  return (
    <form className="rounded-xl border border-[var(--border)] p-5 space-y-3" onSubmit={(e) => e.preventDefault()} aria-label={`${name} calculator`}>
      <div className="grid gap-3 sm:grid-cols-2">
        {inputs.map((i) => (
          <label key={i.key} className="block text-sm">
            <span className="text-[var(--text-secondary)]">{i.label}</span>
            <input
              inputMode="decimal"
              value={vals[i.key]}
              onChange={(e) => setVals((v) => ({ ...v, [i.key]: e.target.value }))}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
            />
          </label>
        ))}
      </div>
      <p className="text-base text-[var(--text-primary)]" aria-live="polite">
        {name}: <strong className="tabular-nums">{Number.isFinite(result) ? fmt(result, unit) : 'enter numbers above'}</strong>
      </p>
      <p className="text-xs text-[var(--text-muted)]">Starts with the six-month totals from the sample data. Replace them with yours; nothing is sent anywhere.</p>
    </form>
  );
}
