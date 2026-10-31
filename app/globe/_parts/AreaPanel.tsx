'use client';

import { IconDownload, IconPolygon } from '@tabler/icons-react';
import { formatArea } from '../../Components/globe/area.mjs';
import { LAYERS } from './layers';
import type { useAreaDraw } from './useAreaDraw';

const LABEL: Record<string, string> = Object.fromEntries(LAYERS.map((l) => [l.id, l.label]));

/** Draw an area on the globe, see what is inside it, export it or ask about it. */
export function AreaPanel({ area, onAsk }: { area: ReturnType<typeof useAreaDraw>; onAsk: (prompt: string) => void }) {
  const { mode, corners, summary } = area;

  const ask = () => {
    if (!summary) return;
    const box = corners.map((c) => `${c.lat.toFixed(2)},${c.lon.toFixed(2)}`).join(' → ');
    const inside = summary.counts.map((c) => `${c.count} ${LABEL[c.layer] || c.layer}`).join(', ') || 'no live pins';
    onAsk(`Look at the area I drew on the globe (corners ${box}, about ${formatArea(summary.areaKm2)}). Inside it right now: ${inside}. What stands out, and what should I watch there?`);
  };

  return (
    <div className="border-b border-[var(--border)] px-3 py-2">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-primary)]">
          <IconPolygon size={13} aria-hidden />
          Area
        </p>
        {mode !== 'off' ? (
          <button type="button" onClick={area.clear} className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
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
            {corners.length < 3
              ? `Click the globe to add corners · ${corners.length} of at least 3`
              : `${corners.length} corners · keep clicking, or finish`}
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
        </div>
      ) : null}
    </div>
  );
}
