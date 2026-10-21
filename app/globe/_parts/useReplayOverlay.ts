'use client';

import { useEffect, useState } from 'react';
import { cursorTime, windowBounds } from '../../Components/globe/scene.mjs';
import { filterByTrail, trailMs } from '../../Components/globe/timeline.mjs';
import { useGlobe } from '../../Components/globe/useGlobe';
import type { SourcePoint } from '../../Components/globe/types';

/**
 * Pushes the points at the playhead onto the map. Returns per-layer counts when the view is not "everything
 * up to now" (null otherwise), and how many points are shown.
 */
export function useReplayOverlay(rawPoints: SourcePoint[], cursor: number, days: number, trail: string) {
  const { setOverlayPoints, setOverlayPaths, setShowCatalog } = useGlobe();
  const [replayCounts, setReplayCounts] = useState<Record<string, number> | null>(null);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const trailLength = trailMs(trail);
    if (cursor >= 1 && trailLength == null) {
      setReplayCounts(null);
      setShown(rawPoints.length);
      setOverlayPoints(rawPoints);
      return;
    }
    const visible = filterByTrail(rawPoints, cursorTime(cursor, windowBounds(days)), trailLength);
    // Every layer that has points starts at 0, so "none in this slice" shows 0 while field layers (weather, air
    // quality), which have no dated points at all, keep their own count.
    const counts: Record<string, number> = {};
    for (const p of rawPoints) {
      const host = String((p as { host?: string }).host || '');
      if (host) counts[host] = 0;
    }
    for (const p of visible) {
      const layer = String((p as { host?: string }).host || '');
      if (layer) counts[layer] = (counts[layer] ?? 0) + 1;
    }
    setReplayCounts(counts);
    setShown(visible.length);
    setOverlayPoints(visible);
  }, [rawPoints, cursor, days, trail, setOverlayPoints]);

  // Leaving the page clears what this page drew on the shared map.
  useEffect(
    () => () => {
      setOverlayPoints([]);
      setOverlayPaths([]);
      setShowCatalog(true);
    },
    [setOverlayPoints, setOverlayPaths, setShowCatalog],
  );

  return { replayCounts, shown };
}
