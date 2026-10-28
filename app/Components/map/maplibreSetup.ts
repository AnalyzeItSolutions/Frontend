'use client';

import { LngLat, setWorkerUrl, type Map as MapLibreMap } from 'maplibre-gl';

let configured = false;

/** MapLibre v6 GeoJSON (ISS orbit line) needs a same-origin worker under Next.js. */
export function ensureMapLibreWorker() {
  if (configured || typeof window === 'undefined') return;
  try {
    setWorkerUrl(`${window.location.origin}/maplibre/maplibre-gl-worker.mjs`);
    configured = true;
  } catch {
    /* older bundles */
  }
}

/** True when a lat/lon faces the camera (map center) on a globe — hide far-side hits. */
export function isFrontFacing(
  camLat: number,
  camLng: number,
  lat: number,
  lng: number,
  /** cos(central angle); ~0 = limb, >0 = front hemisphere */
  minCos = 0.08,
): boolean {
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lng * Math.PI) / 180;
  const φ2 = (camLat * Math.PI) / 180;
  const λ2 = (camLng * Math.PI) / 180;
  const cos =
    Math.sin(φ1) * Math.sin(φ2) + Math.cos(φ1) * Math.cos(φ2) * Math.cos(λ1 - λ2);
  return cos > minCos;
}

type OcclusionTest = { isLocationOccluded?: (lngLat: LngLat) => boolean };

/**
 * True when a lat/lon is in view on the globe. The camera sees less than a hemisphere (it sits a few radii out), so a
 * point a little past the visible limb still passes the angle test and its pin would hang off the globe's edge: ask
 * MapLibre whether the planet hides it, and keep the angle test as the fallback.
 */
export function isVisibleOnGlobe(map: MapLibreMap, lat: number, lng: number): boolean {
  const c = map.getCenter();
  if (!isFrontFacing(c.lat, c.lng, lat, lng)) return false;
  const transform = (map as unknown as { transform?: OcclusionTest }).transform;
  if (typeof transform?.isLocationOccluded !== 'function') return true;
  try {
    return !transform.isLocationOccluded(new LngLat(lng, lat));
  } catch {
    return true;
  }
}
