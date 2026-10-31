'use client';

import { useCallback, useMemo, useState } from 'react';
import { areaGeoJson, areaOutline, areaSummary } from '../../Components/globe/area.mjs';
import type { OverlayPath, SourcePoint } from '../../Components/globe/types';

type Corner = { lat: number; lon: number };
export type AreaMode = 'off' | 'drawing' | 'done';

/**
 * Draw an area by clicking corners on the globe, then see and export every live pin inside it.
 * While drawing, map clicks add corners instead of opening a place (see `onMapClick`).
 */
export function useAreaDraw(points: SourcePoint[]) {
  const [mode, setMode] = useState<AreaMode>('off');
  const [corners, setCorners] = useState<Corner[]>([]);

  const start = useCallback(() => {
    setCorners([]);
    setMode('drawing');
  }, []);
  const clear = useCallback(() => {
    setCorners([]);
    setMode('off');
  }, []);
  const undo = useCallback(() => setCorners((prev) => prev.slice(0, -1)), []);
  /** Show a saved area (a watch) as if it had just been drawn. */
  const show = useCallback((ring: Corner[]) => {
    setCorners(ring);
    setMode(ring.length >= 3 ? 'done' : 'off');
  }, []);
  const finish = useCallback(() => setMode((m) => (m === 'drawing' && corners.length >= 3 ? 'done' : m)), [corners.length]);

  /** True when the click was taken as a corner. */
  const onMapClick = useCallback(
    (lat: number, lon: number) => {
      if (mode !== 'drawing') return false;
      setCorners((prev) => [...prev, { lat, lon }]);
      return true;
    },
    [mode],
  );

  const path = useMemo((): OverlayPath | null => {
    if (mode === 'off' || corners.length < 2) return null;
    return { id: 'drawn-area', kind: 'area', coordinates: areaOutline(corners, mode === 'done') as Array<[number, number]> };
  }, [corners, mode]);

  const summary = useMemo(
    () => (mode === 'done' ? areaSummary(points, corners) : null),
    [mode, points, corners],
  );

  const exportGeoJson = useCallback(() => {
    if (!summary) return;
    const body = JSON.stringify(areaGeoJson(corners, summary.inside, { drawnAt: new Date().toISOString() }), null, 1);
    const url = URL.createObjectURL(new Blob([body], { type: 'application/geo+json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `analyzeit-area-${new Date().toISOString().slice(0, 10)}.geojson`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [corners, summary]);

  return { mode, corners, start, clear, undo, finish, show, onMapClick, path, summary, exportGeoJson };
}
