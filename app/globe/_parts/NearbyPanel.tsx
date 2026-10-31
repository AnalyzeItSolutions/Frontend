'use client';

import { useMemo } from 'react';
import { IconMapPinExclamation } from '@tabler/icons-react';
import { nearMyPlaces } from '../../Components/globe/nearby.mjs';
import type { SourcePoint } from '../../Components/globe/types';
import { LAYERS } from './layers';

const LABEL: Record<string, string> = Object.fromEntries(LAYERS.map((l) => [l.id, l.label]));

/** With My data on: what the live layers show near each of the person's own places, nearest first. */
export function NearbyPanel({
  points,
  myDataOn,
  onGo,
  onAsk,
}: {
  points: SourcePoint[];
  myDataOn: boolean;
  onGo: (lat: number, lon: number, name: string) => void;
  onAsk: (prompt: string) => void;
}) {
  const rows = useMemo(() => (myDataOn ? nearMyPlaces(points) : []), [points, myDataOn]);
  if (!myDataOn) return null;
  const hasMine = points.some((p) => p.host === 'my_data');

  const ask = () => {
    const lines = rows.slice(0, 6).map((r) => `${r.place.label}: ${r.near.map((n) => `${n.point.label} (${LABEL[n.point.host || ''] || n.point.host}, ${n.km} km)`).join('; ')}`);
    onAsk(`These live world events are near my places right now. ${lines.join(' | ')}. Which matter for my business, and what should I do?`);
  };

  return (
    <div className="border-b border-[var(--border)] px-3 py-2">
      <p className="mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-primary)]">
        <IconMapPinExclamation size={13} aria-hidden />
        Near your places
      </p>
      {!hasMine ? (
        <p className="text-[11px] text-[var(--text-secondary)]">Your records with a location appear here once My data loads.</p>
      ) : !rows.length ? (
        <p className="text-[11px] text-[var(--text-secondary)]">Nothing from the layers that are on is near your places right now. Turn on Earthquakes, Fire hotspots or News events to check more.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.place.id}>
              <button
                type="button"
                onClick={() => onGo(r.place.lat, r.place.lon, r.place.label)}
                className="w-full truncate text-left text-[12px] font-medium text-[var(--text-primary)] hover:underline"
              >
                {r.place.label} <span className="font-normal text-[var(--text-secondary)]">· {r.total} near</span>
              </button>
              <ul className="mt-0.5 space-y-0.5">
                {r.near.map((n) => (
                  <li key={n.point.id}>
                    <button
                      type="button"
                      onClick={() => onGo(n.point.lat, n.point.lon, n.point.label)}
                      className="flex w-full justify-between gap-2 text-left text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      <span className="truncate">{LABEL[n.point.host || ''] || n.point.host} · {n.point.label}</span>
                      <span className="shrink-0 tabular-nums">{n.km} km</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <button type="button" onClick={ask} className="btn-primary min-h-8 w-full text-xs">
            What does this mean for me?
          </button>
        </div>
      )}
    </div>
  );
}
