// The Globe timeline as pure functions: an activity histogram, the "trail" filter around the playhead,
// peak finding and stepping. No DOM, so Node's test runner covers all of it.

import { eventEpoch } from './scene.mjs';

export const SPEEDS = [1, 2, 4];
const HOUR = 3_600_000;
export const TRAILS = [
  { id: 'all', label: 'All', ms: null },
  { id: '3d', label: '3 d', ms: 72 * HOUR },
  { id: '24h', label: '24 h', ms: 24 * HOUR },
  { id: '6h', label: '6 h', ms: 6 * HOUR },
  { id: '1h', label: '1 h', ms: HOUR },
];

// Per window: trails that are shorter than the window (a 24 h trail on the 24 h window hid nothing), histogram
// slices of a whole clock unit (30 min, 1 h, 3 h, 6 h, 12 h), and a replay that takes longer for a longer window
// instead of racing a month past in 8 s.
const WINDOWS = {
  1: { trails: ['all', '6h', '1h'], buckets: 48, playSeconds: 8 },
  3: { trails: ['all', '24h', '6h'], buckets: 72, playSeconds: 10 },
  7: { trails: ['all', '24h', '6h'], buckets: 56, playSeconds: 12 },
  14: { trails: ['all', '3d', '24h'], buckets: 56, playSeconds: 16 },
  30: { trails: ['all', '3d', '24h'], buckets: 60, playSeconds: 20 },
};

function windowFor(days) {
  if (WINDOWS[days]) return WINDOWS[days];
  const keys = Object.keys(WINDOWS).map(Number);
  const nearest = keys.reduce((a, b) => (Math.abs(b - days) < Math.abs(a - days) ? b : a), keys[0]);
  return WINDOWS[nearest];
}

/** The trail choices that make sense for a window of `days`. */
export function trailsFor(days) {
  const ids = windowFor(days).trails;
  return TRAILS.filter((t) => ids.includes(t.id));
}

/** Keep a trail if the new window offers it, else fall back to showing everything. */
export function trailForWindow(trail, days) {
  return windowFor(days).trails.includes(trail) ? trail : 'all';
}

/** Histogram slices for a window of `days`. */
export function bucketsFor(days) {
  return windowFor(days).buckets;
}

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

/** Playback advance per 100 ms tick: at 1x the 24 h window takes about 8 s, the 30 d window about 20 s. */
export function playbackStep(speed = 1, days = 1) {
  return (0.1 / windowFor(days).playSeconds) * (SPEEDS.includes(speed) ? speed : 1);
}

/** The next playhead while playing: stops at "now", or wraps to the start when looping. */
export function advancePlayhead(cursor, step, loop = false) {
  const next = cursor + step;
  if (next < 1) return { cursor: next, done: false };
  return loop && cursor < 1 ? { cursor: 1, done: false } : loop ? { cursor: 0, done: false } : { cursor: 1, done: true };
}
