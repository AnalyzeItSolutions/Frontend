// The Globe timeline as pure functions: an activity histogram, the "trail" filter around the playhead,
// peak finding and stepping. No DOM, so Node's test runner covers all of it.

import { eventEpoch } from './scene.mjs';

export const SPEEDS = [1, 2, 4];
export const TRAILS = [
  { id: 'all', label: 'All', ms: null },
  { id: '24h', label: '24 h', ms: 24 * 3_600_000 },
  { id: '6h', label: '6 h', ms: 6 * 3_600_000 },
];

const finite = (n) => typeof n === 'number' && Number.isFinite(n);

export function trailMs(id) {
  return TRAILS.find((t) => t.id === id)?.ms ?? null;
}

/**
 * Events per time slice across the window, split by layer (`host`). Undated points are counted apart.
 * @param {Array<Record<string, any>>} points
 * @param {{start:number,end:number}} bounds
 * @param {number} [count]
 */
export function activityBuckets(points, bounds, count = 48) {
  const n = Math.max(1, Math.floor(count));
  const span = Math.max(1, bounds.end - bounds.start);
  const buckets = Array.from({ length: n }, (_, i) => ({
    start: bounds.start + (span * i) / n,
    end: bounds.start + (span * (i + 1)) / n,
    total: 0,
    layers: {},
  }));
  let undated = 0;
  for (const p of points) {
    const t = eventEpoch(p);
    if (t == null) {
      undated += 1;
      continue;
    }
    if (t < bounds.start || t > bounds.end) continue;
    const i = Math.min(n - 1, Math.floor(((t - bounds.start) / span) * n));
    const layer = String(p.host || 'other');
    buckets[i].total += 1;
    buckets[i].layers[layer] = (buckets[i].layers[layer] ?? 0) + 1;
  }
  return { buckets, max: Math.max(1, ...buckets.map((b) => b.total)), undated };
}

/** Events at or before the cursor and, when a trail is set, no older than `trail` ms before it. Undated points stay. */
export function filterByTrail(points, cursorMs, trail = null) {
  const from = trail == null ? -Infinity : cursorMs - trail;
  return points.filter((p) => {
    const t = eventEpoch(p);
    return t == null || (t <= cursorMs && t >= from);
  });
}

/** How strong an event is, for "jump to the biggest": magnitude, else a layer metric score. */
export function eventStrength(p) {
  const m = p?.meta && typeof p.meta === 'object' ? p.meta : {};
  const v = [p?.mag, m.mag, m.magnitude, m.metric_score].find(finite);
  return v ?? null;
}

/** The strongest dated event; ties go to the more recent one. */
export function peakEvent(points) {
  let best = null;
  let bestScore = -Infinity;
  let bestTime = -Infinity;
  for (const p of points) {
    const t = eventEpoch(p);
    const s = eventStrength(p);
    if (t == null || s == null) continue;
    if (s > bestScore || (s === bestScore && t > bestTime)) {
      best = p;
      bestScore = s;
      bestTime = t;
    }
  }
  return best ? { point: best, time: bestTime, score: bestScore } : null;
}

/** Cursor position (0..1) for a time inside the window. */
export function cursorFor(timeMs, bounds) {
  const span = Math.max(1, bounds.end - bounds.start);
  return Math.min(1, Math.max(0, (timeMs - bounds.start) / span));
}

/** Move the cursor by whole histogram slices; stays inside 0..1. */
export function stepCursor(cursor, direction, count = 48, slices = 1) {
  const next = cursor + (direction < 0 ? -1 : 1) * (slices / Math.max(1, count));
  return Math.min(1, Math.max(0, Math.round(next * 10_000) / 10_000));
}

/** Playback advance per 100 ms tick: 1x crosses the window in about 8 s. */
export function playbackStep(speed = 1) {
  return 0.0125 * (SPEEDS.includes(speed) ? speed : 1);
}
