'use client';

import { useEffect, type MutableRefObject } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';

/** Degrees of longitude per second: slow enough to be scenery, not motion you have to track. */
const DEGREES_PER_SECOND = 0.9;
const SEGMENT_MS = 6000;
/** After any touch of the globe, wait this long before turning again. */
const RESUME_AFTER_MS = 4500;
/** Zoomed in on a region, spinning would drag the view away from what you are looking at. */
const MAX_ZOOM = 4.2;

/**
 * A slow idle rotation for the full globe. It only runs when `enabled`, never while a fly-to is under way, and it
 * steps aside at once for any pointer, wheel, touch or key input on the map, resuming a few seconds after the last one.
 */
export function useAutoRotate({
  getMap,
  enabled,
  flyActive,
}: {
  getMap: () => MapLibreMap | null;
  enabled: boolean;
  flyActive: MutableRefObject<boolean>;
}) {
  useEffect(() => {
    if (!enabled) return undefined;
    const map = getMap();
    if (!map) return undefined;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    let stopped = false;
    let resumeTimer: number | null = null;
    let spinning = false;
    const container = map.getCanvasContainer();

    const spin = () => {
      if (stopped || spinning || flyActive.current || map.isMoving() || map.getZoom() > MAX_ZOOM) return;
      const c = map.getCenter();
      spinning = true;
      map.easeTo({
        center: [c.lng + (DEGREES_PER_SECOND * SEGMENT_MS) / 1000, c.lat],
        duration: SEGMENT_MS,
        easing: (t) => t,
        essential: false,
      });
    };

    const onMoveEnd = () => {
      if (!spinning) return;
      spinning = false;
      if (!stopped && resumeTimer == null) spin(); // our own segment finished: carry straight on
    };

    const interrupt = () => {
      if (resumeTimer != null) window.clearTimeout(resumeTimer);
      if (spinning) {
        spinning = false;
        try {
          map.stop();
        } catch {
          /* ignore */
        }
      }
      resumeTimer = window.setTimeout(() => {
        resumeTimer = null;
        spin();
      }, RESUME_AFTER_MS);
    };

    const events = ['pointerdown', 'wheel', 'touchstart', 'keydown'] as const;
    events.forEach((e) => container.addEventListener(e, interrupt, { passive: true }));
    map.on('moveend', onMoveEnd);
    const start = window.setTimeout(spin, 1200);

    return () => {
      stopped = true;
      window.clearTimeout(start);
      if (resumeTimer != null) window.clearTimeout(resumeTimer);
      events.forEach((e) => container.removeEventListener(e, interrupt));
      map.off('moveend', onMoveEnd);
      if (spinning && !flyActive.current) {
        try {
          map.stop();
        } catch {
          /* ignore */
        }
      }
    };
  }, [enabled, getMap, flyActive]);
}
