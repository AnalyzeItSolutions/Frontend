'use client';

import { IconCurrentLocation, IconLoader2, IconMap, IconMinus, IconPlus, IconSearch, IconWorld, IconX } from '@tabler/icons-react';
import { useGlobe } from '../../Components/globe/useGlobe';
import type { GeoSearchHit } from '../../lib/geoApi';
import type { Selected } from './layers';

const roundBtn =
  'flex h-8 min-w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] active:scale-95 disabled:opacity-40';

const DRAW_MODES = [
  ['pins', 'Pins'],
  ['heat', 'Heat'],
  ['density', 'Density'],
  ['bars', 'Bars'],
] as const;

/** The left rail's top block: place search, zoom, projection and draw mode. */
export function SearchControls({
  query,
  onQuery,
  hits,
  searching,
  onPick,
  onClear,
  selected,
  onResetRails,
}: {
  query: string;
  onQuery: (q: string) => void;
  hits: GeoSearchHit[];
  searching: boolean;
  onPick: (hit: GeoSearchHit) => void;
  onClear: () => void;
  selected: Selected | null;
  onResetRails: () => void;
}) {
  const { flyToLatLon, camera, dataView, setDataView, mapProjection, setMapProjection } = useGlobe();

  const zoomTo = (delta: number, min: number, max: number, fallback: number) => {
    if (!selected) return flyToLatLon(20, 0, { zoom: fallback, user: true });
    flyToLatLon(selected.lat, selected.lon, {
      zoom: Math.min(max, Math.max(min, camera.zoom + delta)),
      name: selected.name,
      user: true,
    });
  };

  return (
    <div className="space-y-2.5 border-b border-[var(--border)] p-3">
      <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 transition-shadow focus-within:shadow-[0_0_0_2px_var(--brand)]">
        <IconSearch size={15} className="shrink-0 text-brand" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && hits[0]) {
              e.preventDefault();
              onPick(hits[0]);
            }
          }}
          placeholder="Place, metric, weather…"
          className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          aria-label="Search places"
        />
        {query ? (
          <button type="button" onClick={onClear} className="flex h-8 w-8 items-center justify-center text-[var(--text-muted)]" aria-label="Clear search">
            <IconX size={14} />
          </button>
        ) : null}
        {searching ? <IconLoader2 size={14} className="animate-spin text-brand" /> : null}
      </div>

      <div className="flex items-center gap-1.5">
        <button type="button" className={roundBtn} title="Zoom in" aria-label="Zoom in" onClick={() => zoomTo(1, 1.4, 12, 3)}>
          <IconPlus size={14} />
        </button>
        <button type="button" className={roundBtn} title="Zoom out" aria-label="Zoom out" onClick={() => zoomTo(-1, 1.4, 12, 1.6)}>
          <IconMinus size={14} />
        </button>
        <button
          type="button"
          className={roundBtn}
          title="Locate selection"
          aria-label="Locate selection"
          disabled={!selected}
          onClick={() => selected && flyToLatLon(selected.lat, selected.lon, { zoom: 6.5, name: selected.name, user: true })}
        >
          <IconCurrentLocation size={14} />
        </button>
        <button type="button" className="ml-auto text-[11px] font-medium text-[var(--text-primary)] underline-offset-2 hover:underline" onClick={onResetRails}>
          Reset width
        </button>
      </div>

      <div className="globe-seg" role="group" aria-label="Map projection">
        <button type="button" aria-pressed={mapProjection === 'globe'} onClick={() => setMapProjection('globe')} title="3D globe">
          <IconWorld size={12} />
          Globe
        </button>
        <button type="button" aria-pressed={mapProjection === 'mercator'} onClick={() => setMapProjection('mercator')} title="Flat geographic map">
          <IconMap size={12} />
          Flat
        </button>
      </div>

      <div className="globe-seg" role="group" aria-label="Draw mode">
        {DRAW_MODES.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={dataView === id} onClick={() => setDataView(id)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
