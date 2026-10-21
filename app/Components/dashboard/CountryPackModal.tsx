'use client';

import { useEffect, useMemo, useState } from 'react';
import { IconCheck, IconLoader2, IconSearch, IconWorld } from '@tabler/icons-react';
import { Modal } from '../ui/Modal';
import { buildCountryPack, listCountries, type Country, type PackResult } from '../../lib/countryPackApi';

const POPULAR = ['FRA', 'DEU', 'GBR', 'USA', 'IND', 'JPN', 'BRA', 'CHN'];

/** Pick a country and the dashboard builds itself from open data: headline figures, trends, news, and alert rules. */
export function CountryPackModal({
  open,
  onClose,
  projectId,
  onBuilt,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onBuilt: (result: PackResult) => void;
}) {
  const [countries, setCountries] = useState<Country[] | null>(null);
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<Country | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PackResult | null>(null);

  useEffect(() => {
    if (!open || countries) return;
    listCountries().then(setCountries).catch((e: unknown) => setError(e instanceof Error ? e.message : 'Could not load countries'));
  }, [open, countries]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = countries ?? [];
    if (!q) return POPULAR.map((c) => list.find((x) => x.iso3 === c)).filter(Boolean) as Country[];
    return list.filter((c) => c.name.toLowerCase().includes(q) || c.iso3.toLowerCase() === q).slice(0, 12);
  }, [countries, query]);

  const close = () => {
    setQuery('');
    setPicked(null);
    setResult(null);
    setError('');
    onClose();
  };

  const build = async () => {
    if (!picked) return;
    setBusy(true);
    setError('');
    try {
      const out = await buildCountryPack(projectId, picked.iso3);
      setResult(out);
      onBuilt(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not build the dashboard');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Track a country" description="Pick a country and the dashboard builds itself from open public data — no files, no setup." size="lg">
      {result ? (
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]"><IconCheck size={16} className="text-[#3FB68C]" /> {result.country} dashboard is ready</p>
          <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
            <li>{result.widgets} widgets: headline figures, trends over time and the latest news.</li>
            <li>{result.rules.length} alert rules switched on (for example inflation, unemployment, growth, debt). Change any level from <strong>Alerts</strong>.</li>
            <li>Everything refreshes by itself every few hours; you never have to touch it.</li>
            {result.alerts.length ? <li className="text-[var(--text-primary)]">{result.alerts.length} alert{result.alerts.length === 1 ? '' : 's'} already raised: {result.alerts.map((a) => a.title).join('; ')}</li> : null}
            {result.missing.length ? <li>Not published for {result.country} yet: {result.missing.join(', ')}.</li> : null}
            {result.dropped ? <li>Your plan holds fewer widgets than the full set, so {result.dropped} were left out.</li> : null}
            {result.news_error ? <li>News could not be loaded right now: {result.news_error}</li> : null}
          </ul>
          <div className="flex justify-end"><button type="button" onClick={close} className="btn-primary text-sm">View dashboard</button></div>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="relative block">
            <IconSearch size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search 200+ countries…" aria-label="Search countries" autoFocus className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--coral)]" />
          </label>
          {!query ? <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Popular</p> : null}
          <div role="radiogroup" aria-label="Country" className="grid max-h-60 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
            {countries === null && !error ? <p className="col-span-full flex items-center gap-2 py-6 text-xs text-[var(--text-muted)]"><IconLoader2 size={14} className="animate-spin" /> Loading countries…</p> : null}
            {shown.map((c) => (
              <button key={c.iso3} type="button" role="radio" aria-checked={picked?.iso3 === c.iso3} onClick={() => setPicked(c)} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors ${picked?.iso3 === c.iso3 ? 'border-[var(--coral)] bg-[var(--coral)]/10' : 'border-[var(--border)] hover:border-[var(--coral)]/50'}`}>
                <IconWorld size={14} className="shrink-0 text-[var(--text-muted)]" />
                <span className="min-w-0 truncate">{c.name}</span>
              </button>
            ))}
            {countries && shown.length === 0 ? <p className="col-span-full py-4 text-xs text-[var(--text-muted)]">No country matches “{query}”.</p> : null}
          </div>
          {error ? <p role="alert" className="text-xs text-[var(--danger)]">{error}</p> : null}
          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-[var(--text-muted)]">Adds to this dashboard; widgets you already have stay.</p>
            <button type="button" onClick={() => void build()} disabled={!picked || busy} className="btn-primary inline-flex items-center gap-1.5 text-sm disabled:opacity-50">
              {busy ? <IconLoader2 size={14} className="animate-spin" /> : null}
              {busy ? 'Building…' : picked ? `Build ${picked.name} dashboard` : 'Pick a country'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
