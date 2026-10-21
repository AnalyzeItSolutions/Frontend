'use client';

import { useEffect, useRef, useState } from 'react';
import { IconBuilding, IconCheck, IconChartLine, IconHash, IconLoader2, IconMapPin, IconSearch, IconWorld } from '@tabler/icons-react';
import { Modal } from '../ui/Modal';
import { buildTracker, searchTrackables, type PackResult, type Trackable, type TrackKind } from '../../lib/countryPackApi';

const KIND: Record<TrackKind, { label: string; Icon: typeof IconWorld }> = {
  country: { label: 'Country', Icon: IconWorld },
  market: { label: 'Market', Icon: IconChartLine },
  place: { label: 'Place', Icon: IconMapPin },
  topic: { label: 'Topic', Icon: IconHash },
};

const IDEAS = ['France', 'Apple', 'S&P 500', 'Bitcoin', 'Gold', 'EUR/USD', 'Mumbai', 'Emmanuel Macron'];

/** Type anything — a country, a company, an index, a currency, a city, a person, an event — and the dashboard builds itself from open data. */
export function TrackerModal({ open, onClose, projectId, onBuilt }: { open: boolean; onClose: () => void; projectId: string; onBuilt: (result: PackResult) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Trackable[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<Trackable | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PackResult | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();
    abort.current?.abort();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return undefined;
    }
    const ac = new AbortController();
    abort.current = ac;
    setSearching(true);
    const t = window.setTimeout(() => {
      searchTrackables(q, ac.signal)
        .then((rows) => !ac.signal.aborted && (setResults(rows), setError('')))
        .catch((e: unknown) => !ac.signal.aborted && setError(e instanceof Error ? e.message : 'Could not search'))
        .finally(() => !ac.signal.aborted && setSearching(false));
    }, 250);
    return () => {
      window.clearTimeout(t);
      ac.abort();
    };
  }, [query]);

  const close = () => {
    setQuery('');
    setResults([]);
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
      const out = await buildTracker(projectId, picked);
      setResult(out);
      onBuilt(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not build the dashboard');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Track anything" description="A country, a company, an index, a currency, a city, a person or an event. The dashboard builds itself from open public data." size="lg">
      {result ? (
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]"><IconCheck size={16} className="text-[#3FB68C]" /> {result.name || result.country} is on your dashboard</p>
          <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
            <li>{result.widgets} widgets: headline figures, trends over time, background and the latest news.</li>
            <li>{result.rules.length} alert rule{result.rules.length === 1 ? '' : 's'} switched on. Change any level from <strong>Alerts</strong>.</li>
            <li>It refreshes by itself every few hours; you never have to touch it.</li>
            {result.alerts.length ? <li className="text-[var(--text-primary)]">{result.alerts.length} alert{result.alerts.length === 1 ? '' : 's'} already raised: {result.alerts.map((a) => a.title).join('; ')}</li> : null}
            {result.missing.length ? <li>Not available for this yet: {result.missing.join(', ')}.</li> : null}
            {result.dropped ? <li>Your plan holds fewer widgets than the full set, so {result.dropped} were left out.</li> : null}
            {result.news_error ? <li>News could not be loaded right now: {result.news_error}</li> : null}
          </ul>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setResult(null); setPicked(null); setQuery(''); }} className="btn-secondary text-sm">Track another</button>
            <button type="button" onClick={close} className="btn-primary text-sm">View dashboard</button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="relative block">
            <IconSearch size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input value={query} onChange={(e) => { setQuery(e.target.value); setPicked(null); }} placeholder="Try France, Apple, Bitcoin, Mumbai, or any name…" aria-label="Search what to track" autoFocus className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] py-2 pl-9 pr-9 text-sm outline-none focus:border-[var(--coral)]" />
            {searching ? <IconLoader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[var(--text-muted)]" /> : null}
          </label>
          {query.trim().length < 2 ? (
            <div>
              <p className="mb-2 text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Ideas</p>
              <div className="flex flex-wrap gap-2">
                {IDEAS.map((idea) => (
                  <button key={idea} type="button" onClick={() => setQuery(idea)} className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)]">{idea}</button>
                ))}
              </div>
            </div>
          ) : (
            <div role="radiogroup" aria-label="What to track" className="max-h-64 space-y-1 overflow-y-auto">
              {results.map((r) => {
                const { Icon, label } = KIND[r.kind];
                const on = picked?.kind === r.kind && picked.ref === r.ref;
                return (
                  <button key={`${r.kind}:${r.ref}`} type="button" role="radio" aria-checked={on} onClick={() => setPicked(r)} className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${on ? 'border-[var(--coral)] bg-[var(--coral)]/10' : 'border-[var(--border)] hover:border-[var(--coral)]/50'}`}>
                    <Icon size={16} className="mt-0.5 shrink-0 text-[var(--text-muted)]" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-[var(--text-primary)]">{r.name}</span>
                      <span className="block truncate text-[11px] text-[var(--text-muted)]">{r.kind === 'topic' ? `${label} · ${r.subtitle}` : r.subtitle}</span>
                    </span>
                  </button>
                );
              })}
              {!searching && results.length === 0 ? <p className="py-3 text-xs text-[var(--text-muted)]">Nothing found yet. Keep typing.</p> : null}
            </div>
          )}
          {error ? <p role="alert" className="text-xs text-[var(--danger)]">{error}</p> : null}
          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-[var(--text-muted)]">Adds to this dashboard; widgets you already have stay.</p>
            <button type="button" onClick={() => void build()} disabled={!picked || busy} className="btn-primary inline-flex items-center gap-1.5 text-sm disabled:opacity-50">
              {busy ? <IconLoader2 size={14} className="animate-spin" /> : <IconBuilding size={14} />}
              {busy ? 'Building…' : picked ? `Track ${picked.name.length > 28 ? `${picked.name.slice(0, 27)}…` : picked.name}` : 'Pick something'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
