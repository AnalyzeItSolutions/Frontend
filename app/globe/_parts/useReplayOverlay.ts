'use client';

import { useEffect, useState } from 'react';
import { cursorTime, filterByCursor, windowBounds } from '../../Components/globe/scene.mjs';
import { useGlobe } from '../../Components/globe/useGlobe';
import type { SourcePoint } from '../../Components/globe/types';

/** Pushes the points up to the replay cursor onto the map; returns per-layer counts while replaying (null = live). */
export function useReplayOverlay(rawPoints: SourcePoint[], cursor: number, days: number) {
  const { setOverlayPoints, setOverlayPaths, setShowCatalog } = useGlobe();
  const [replayCounts, setReplayCounts] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    if (cursor >= 1) {
      setReplayCounts(null);
      setOverlayPoints(rawPoints);
      return;
    }
    const shown = filterByCursor(rawPoints, cursorTime(cursor, windowBounds(days)));
    const counts: Record<string, number> = {};
    for (const p of shown) {
      const layer = String((p as { host?: string }).host || '');
      if (layer) counts[layer] = (counts[layer] ?? 0) + 1;
    }
    setReplayCounts(counts);
    setOverlayPoints(shown);
  }, [rawPoints, cursor, days, setOverlayPoints]);

  // Leaving the page clears what this page drew on the shared map.
  useEffect(
    () => () => {
      setOverlayPoints([]);
      setOverlayPaths([]);
      setShowCatalog(true);
    },
    [setOverlayPoints, setOverlayPaths, setShowCatalog],
  );

  return replayCounts;
}
