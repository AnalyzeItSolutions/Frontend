import type { SourcePoint } from './types';

export const NEAR_KM: Record<string, number>;
export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number;
export function nearMyPlaces(
  points: SourcePoint[],
  opts?: { limitPlaces?: number; limitPerPlace?: number },
): Array<{ place: SourcePoint; near: Array<{ point: SourcePoint; km: number }>; total: number }>;
