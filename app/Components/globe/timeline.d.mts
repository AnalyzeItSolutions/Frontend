export const SPEEDS: number[];
export const TRAILS: Array<{ id: string; label: string; ms: number | null }>;
export function trailMs(id: string): number | null;
export function activityBuckets(
  points: Array<Record<string, any>>,
  bounds: { start: number; end: number },
  count?: number,
): { buckets: Array<{ start: number; end: number; total: number; layers: Record<string, number> }>; max: number; undated: number };
export function filterByTrail<T extends Record<string, any>>(points: T[], cursorMs: number, trail?: number | null): T[];
export function eventStrength(p: Record<string, any>): number | null;
export function peakEvent<T extends Record<string, any>>(points: T[]): { point: T; time: number; score: number } | null;
export function cursorFor(timeMs: number, bounds: { start: number; end: number }): number;
export function stepCursor(cursor: number, direction: number, count?: number, slices?: number): number;
export function playbackStep(speed?: number): number;
