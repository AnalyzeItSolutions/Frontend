'use client';

import { useCallback, useEffect, useRef } from 'react';
import { fetchGlobeEvents } from '../../lib/geoApi';
import { inferGlobeLayers } from './chatLayers.mjs';
import { buildLiveOverlays } from './liveOverlays.mjs';
import type { SourcePoint } from './types';
import { useGlobe } from './useGlobe';

type Events = Array<Record<string, unknown>>;

/**
 * Chat's "research on the globe": when a question is about earthquakes, storms, air quality and the like,
 * pull just those live layers and draw them on the chat globe. Questions that are not about the world draw nothing.
 */
export function useChatLayers() {
  const { setOverlayPoints, setOverlayPaths } = useGlobe();
  const abortRef = useRef<AbortController | null>(null);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setOverlayPoints([]);
    setOverlayPaths([]);
  }, [setOverlayPoints, setOverlayPaths]);

  // Leaving Chat takes its drawing off the shared map.
  useEffect(() => clear, [clear]);

  /** Returns the layer ids it drew, so the "Open on globe" link can carry them. */
  const showFor = useCallback(
    async (text: string): Promise<string[]> => {
      clear();
      const ids = inferGlobeLayers(text);
      if (!ids.length) return [];
      const ac = new AbortController();
      abortRef.current = ac;
      const merged: Record<string, { events?: Events; path?: Array<{ lat?: number; lon?: number }>; lines?: Events }> = {};
      await Promise.all(
        ids.map(async (id) => {
          try {
            const data = await fetchGlobeEvents({ layers: [id], days: 7, minMagnitude: 2.5, signal: ac.signal });
            const bucket = ((data.layers || {}) as Record<string, { available?: boolean; events?: Events; path?: Array<{ lat?: number; lon?: number }>; lines?: Events }>)[id];
            if (bucket && bucket.available !== false) {
              merged[id] = { events: bucket.events || [], ...(bucket.path ? { path: bucket.path } : {}), ...(bucket.lines ? { lines: bucket.lines } : {}) };
            }
          } catch {
            /* a layer that will not load is simply not drawn */
          }
        }),
      );
      if (ac.signal.aborted) return [];
      const flags = Object.fromEntries(ids.map((id) => [id, true]));
      const { points, paths } = buildLiveOverlays(flags, merged);
      setOverlayPoints(points as SourcePoint[]);
      setOverlayPaths(paths);
      return ids.filter((id) => merged[id]);
    },
    [clear, setOverlayPoints, setOverlayPaths],
  );

  return { showFor, clear };
}
