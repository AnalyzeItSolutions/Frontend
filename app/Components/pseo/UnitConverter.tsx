'use client';

import { useState } from 'react';
import { convert, nice, pair } from '../../lib/convert/units.mjs';

/** Two-way converter for one unit pair. Same convert() as the server-rendered table, so they always agree. */
export function UnitConverter({ slug, start = 1 }: { slug: string; start?: number }) {
  const p = pair(slug)!;
  const back = pair(`${p.to.id}-to-${p.from.id}`)!;
  const [a, setA] = useState(String(start));
  const [b, setB] = useState(nice(convert(p, start)).replace(/,/g, ''));
  const field = (label: string, value: string, onChange: (v: string) => void) => (
    <label className="block text-sm">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
    </label>
  );
  const num = (s: string) => Number(s.replace(/,/g, ''));
  return (
    <form className="rounded-xl border border-[var(--border)] p-5 grid gap-3 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()} aria-label={`${p.from.plural} to ${p.to.plural} converter`}>
      {field(`${p.from.plural} (${p.from.symbol})`, a, (v) => { setA(v); const n = num(v); setB(v.trim() && Number.isFinite(n) ? nice(convert(p, n)).replace(/,/g, '') : ''); })}
      {field(`${p.to.plural} (${p.to.symbol})`, b, (v) => { setB(v); const n = num(v); setA(v.trim() && Number.isFinite(n) ? nice(convert(back, n)).replace(/,/g, '') : ''); })}
    </form>
  );
}
