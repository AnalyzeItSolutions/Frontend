'use client';

import { useState } from 'react';
import { IconBell, IconDownload, IconPolygon } from '@tabler/icons-react';
import { formatArea } from '../../Components/globe/area.mjs';
import { LAYERS } from './layers';
import type { useAreaDraw } from './useAreaDraw';
import type { useAreaWatches } from './useAreaWatches';

const LABEL: Record<string, string> = Object.fromEntries(LAYERS.map((l) => [l.id, l.label]));
const DEFAULT_WATCH = ['earthquakes', 'hotspots', 'weather_alerts', 'disasters'];

/** Draw an area on the globe, see what is inside it, export it, ask about it, or watch it for new events. */
export function AreaPanel({
  area,
  watching,
  onAsk,
  onGo,
}: {
  area: ReturnType<typeof useAreaDraw>;
  watching: ReturnType<typeof useAreaWatches>;
  onAsk: (prompt: string) => void;
  onGo: (lat: number, lon: number) => void;
}) {
  const { mode, corners, summary } = area;
  const [form, setForm] = useState(false);
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<string[]>(DEFAULT_WATCH);
  const [minMag, setMinMag] = useState(4.5);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const ask = () => {
    if (!summary) return;
    const box = corners.map((c) => `${c.lat.toFixed(2)},${c.lon.toFixed(2)}`).join(' → ');
    const inside = summary.counts.map((c) => `${c.count} ${LABEL[c.layer] || c.layer}`).join(', ') || 'no live pins';
    onAsk(`Look at the area I drew on the globe (corners ${box}, about ${formatArea(summary.areaKm2)}). Inside it right now: ${inside}. What stands out, and what should I watch there?`);
  };

  const save = async () => {
    setBusy(true);
    setNote(null);
    try {
      await watching.add({
        name: name.trim() || 'Watched area',
        ring: corners.map((c) => ({ lat: c.lat, lon: c.lon })),
        layers: picked,
        thresholds: { min_magnitude: minMag },
      });
      setForm(false);
      setName('');
      setNote(`Watching. New events inside it raise an alert in ${watching.project?.name || 'your project'}, sent the way its alert settings say.`);
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Could not watch this area');
    } finally {
      setBusy(false);
    }
  };

  const centre = (ring: Array<{ lat: number; lon: number }>) => ({
    lat: ring.reduce((s, c) => s + c.lat, 0) / ring.length,
    lon: ring.reduce((s, c) => s + c.lon, 0) / ring.length,
  });

  return (
    <div className="border-b border-[var(--border)] px-3 py-2">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-primary)]">
          <IconPolygon size={13} aria-hidden />
          Area
        </p>
        {mode !== 'off' ? (
          <button type="button" onClick={() => { area.clear(); setForm(false); }} className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Clear
          </button>
        ) : null}
      </div>

      {mode === 'off' ? (
        <button type="button" onClick={area.start} className="btn-secondary min-h-8 w-full text-xs">
          Draw an area
        </button>
      ) : null}

      {mode === 'drawing' ? (
        <div className="space-y-1.5">
          <p className="text-[11px] text-[var(--text-secondary)]" aria-live="polite">
            {corners.length < 3 ? `Click the globe to add corners · ${corners.length} of at least 3` : `${corners.length} corners · keep clicking, or finish`}
          </p>
          <div className="flex gap-1.5">
            <button type="button" onClick={area.undo} disabled={!corners.length} className="btn-secondary min-h-8 flex-1 text-xs disabled:opacity-50">
              Undo
            </button>
            <button type="button" onClick={area.finish} disabled={corners.length < 3} className="btn-primary min-h-8 flex-1 text-xs disabled:opacity-50">
              Finish
            </button>
          </div>
        </div>
      ) : null}

      {mode === 'done' && summary ? (
        <div className="space-y-1.5">
          <p className="text-[11px] text-[var(--text-secondary)]">
            {formatArea(summary.areaKm2)} · {summary.inside.length.toLocaleString('en-US')} live pin{summary.inside.length === 1 ? '' : 's'} inside
          </p>
          {summary.counts.length ? (
            <ul className="space-y-0.5">
              {summary.counts.map((c) => (
                <li key={c.layer} className="flex justify-between text-[11px] text-[var(--text-primary)]">
                  <span>{LABEL[c.layer] || c.layer}</span>
                  <span className="tabular-nums text-[var(--text-secondary)]">{c.count.toLocaleString('en-US')}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-[var(--text-secondary)]">Turn on a layer to see what is inside.</p>
          )}
          <div className="flex gap-1.5">
            <button type="button" onClick={area.exportGeoJson} className="btn-secondary inline-flex min-h-8 flex-1 items-center justify-center gap-1 text-xs">
              <IconDownload size={13} aria-hidden />
              GeoJSON
            </button>
            <button type="button" onClick={ask} className="btn-primary min-h-8 flex-1 text-xs">
              Ask about it
            </button>
          </div>
          {!form ? (
            <button
              type="button"
              onClick={() => setForm(true)}
              disabled={!watching.project}
              title={watching.project ? undefined : 'Create a project first: watched areas belong to a project, like its other alerts.'}
              className="btn-secondary inline-flex min-h-8 w-full items-center justify-center gap-1 text-xs disabled:opacity-50"
            >
              <IconBell size={13} aria-hidden />
              Watch this area
            </button>
          ) : (
            <div className="space-y-1.5 rounded-lg border border-[var(--border)] p-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name, e.g. Mumbai warehouse"
                aria-label="Name of the watched area"
                maxLength={80}
                className="h-8 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 text-[12px] text-[var(--text-primary)] outline-none"
              />
              <p className="text-[11px] text-[var(--text-secondary)]">Alert me about new</p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                {watching.layers.map((l) => (
                  <label key={l.id} className="flex items-center gap-1.5 text-[11px] text-[var(--text-primary)]">
                    <input
                      type="checkbox"
                      checked={picked.includes(l.id)}
                      onChange={() => setPicked((p) => (p.includes(l.id) ? p.filter((x) => x !== l.id) : [...p, l.id]))}
                    />
                    {l.label}
                  </label>
                ))}
              </div>
              {picked.includes('earthquakes') ? (
                <label className="flex items-center justify-between gap-2 text-[11px] text-[var(--text-secondary)]">
                  Earthquakes from magnitude
                  <input
                    type="number"
                    min={2.5}
                    max={9.5}
                    step={0.5}
                    value={minMag}
                    onChange={(e) => setMinMag(Number(e.target.value))}
                    className="h-7 w-16 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-1.5 text-[12px] text-[var(--text-primary)]"
                  />
                </label>
              ) : null}
              <div className="flex gap-1.5">
                <button type="button" onClick={() => setForm(false)} className="btn-secondary min-h-8 flex-1 text-xs">
                  Cancel
                </button>
                <button type="button" onClick={() => void save()} disabled={busy || !picked.length} className="btn-primary min-h-8 flex-1 text-xs disabled:opacity-50">
                  {busy ? 'Saving…' : 'Watch'}
                </button>
              </div>
              <p className="text-[10px] text-[var(--text-secondary)]">Checked every 15 minutes. What is inside now is not reported, only what is new.</p>
            </div>
          )}
        </div>
      ) : null}

      {note ? <p className="mt-1.5 text-[11px] text-[var(--text-secondary)]" role="status">{note}</p> : null}

      {watching.watches.length ? (
        <div className="mt-2">
          <p className="globe-layer-group-title">Watched areas</p>
          <ul className="space-y-1">
            {watching.watches.map((w) => (
              <li key={w.id} className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    area.show(w.ring);
                    const c = centre(w.ring);
                    onGo(c.lat, c.lon);
                  }}
                  className="min-w-0 flex-1 truncate text-left text-[var(--text-primary)] hover:underline"
                  title={`${w.layers.map((l) => LABEL[l] || l).join(', ')}${w.last_checked ? ` · checked ${new Date(w.last_checked).toLocaleTimeString()}` : ' · first check within 15 min'}`}
                >
                  {w.name}
                  <span className="text-[var(--text-secondary)]"> · {w.alerts_sent} alert{w.alerts_sent === 1 ? '' : 's'}</span>
                </button>
                <button type="button" onClick={() => void watching.remove(w.id)} className="shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  Stop
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
