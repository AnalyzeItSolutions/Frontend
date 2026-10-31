'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { IconWorld } from '@tabler/icons-react';
import type { WidgetSpec } from '../../lib/chatApi';
import { fetchGlobeEvents } from '../../lib/geoApi';
import { LAYER_CATALOG } from '../globe/layerCatalog.mjs';
import { LAYER_COLORS } from '../globe/layerColors.mjs';

type GlobeProps = {
  layers?: string[];
  center?: { lat: number; lon: number; zoom?: number };
  outline?: Array<[number, number]>;
};

const LABEL: Record<string, string> = Object.fromEntries((LAYER_CATALOG as Array<{ id: string; label: string }>).map((l) => [l.id, l.label]));

let basemapPromise: Promise<object> | null = null;
/** Natural Earth countries, built once per page from the copy the app already ships (no tile server). */
function basemap(): Promise<object> {
  basemapPromise ??= Promise.all([import('topojson-client'), import('world-atlas/countries-110m.json')]).then(([topo, world]) => {
    const data = (world as { default?: unknown }).default ?? world;
    return topo.feature(data as never, (data as { objects: { countries: never } }).objects.countries);
  });
  return basemapPromise;
}

/** A live globe on a dashboard: the layers, view and area it was saved with, refreshed every minute. */
export function GlobeViewWidget({ widget }: { widget: WidgetSpec }) {
  const props = (widget.props || {}) as GlobeProps;
  const layers = (props.layers || ['earthquakes']).filter((l) => LABEL[l]);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [failed, setFailed] = useState(false);
  const key = JSON.stringify([layers, props.center, props.outline]);

  useEffect(() => {
    let globe: { destroy: () => void } | null = null;
    let cancelled = false;
    (async () => {
      try {
        const [{ createGlobe }, world] = await Promise.all([import('../../../packages/globe-embed/src/globe.mjs'), basemap()]);
        if (cancelled || !hostRef.current) return;
        globe = createGlobe(hostRef.current, {
          basemap: world,
          workerUrl: `${window.location.origin}/maplibre/maplibre-gl-worker.mjs`,
          layers,
          center: props.center,
          outline: props.outline,
          theme: document.documentElement.classList.contains('light') ? 'light' : 'dark',
          fetchLayer: async (id: string) => {
            const near = id === 'flights' && props.center ? { lat: props.center.lat, lon: props.center.lon } : null;
            const data = await fetchGlobeEvents({ layers: [id], minMagnitude: 2.5, days: 7, near });
            return ((data.layers || {}) as Record<string, Record<string, unknown>>)[id] || { events: [] };
          },
          onUpdate: (s: { counts: Record<string, number> }) => setCounts(s.counts),
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      globe?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const href = `/globe?layers=${layers.join(',')}`;
  return (
    <div className="glass-card overflow-hidden rounded-2xl border border-[var(--border)]">
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <p className="inline-flex min-w-0 items-center gap-1.5 truncate text-sm font-medium text-[var(--text-primary)]">
          <IconWorld size={15} aria-hidden />
          {widget.title || 'Globe'}
        </p>
        <Link href={href} className="shrink-0 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          Open on globe
        </Link>
      </div>
      <div className="relative mx-3 mt-2 h-72 overflow-hidden rounded-xl bg-[#0b0d10]">
        <div ref={hostRef} className="absolute inset-0" />
        {failed ? <p className="absolute inset-0 grid place-items-center text-xs text-[var(--text-secondary)]">The globe could not load here.</p> : null}
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 px-4 py-3 text-xs text-[var(--text-secondary)]">
        {layers.map((l) => (
          <li key={l} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: (LAYER_COLORS as Record<string, string>)[l] }} aria-hidden />
            {LABEL[l]} <span className="tabular-nums text-[var(--text-primary)]">{counts[l] != null ? counts[l].toLocaleString('en-US') : '…'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
