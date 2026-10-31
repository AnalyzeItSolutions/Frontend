/**
 * A drawn area on the globe: which live pins fall inside it, how big it is, and its GeoJSON export.
 * Pure and dependency-free so Node's test runner can import it. Corners are { lat, lon }.
 */

const R_KM = 6371.0088;

/** Longitudes made continuous from the first corner, so an area across the date line is not read inside-out. */
export function unwrapRing(ring) {
  if (!ring?.length) return [];
  const out = [{ lat: ring[0].lat, lon: ring[0].lon }];
  for (let i = 1; i < ring.length; i += 1) {
    let lon = ring[i].lon;
    const prev = out[i - 1].lon;
    while (lon - prev > 180) lon -= 360;
    while (lon - prev < -180) lon += 360;
    out.push({ lat: ring[i].lat, lon });
  }
  return out;
}

/** Ray casting on the unwrapped ring; the point is tried at its longitude and one turn either way. */
export function pointInArea(point, ring) {
  if (!ring || ring.length < 3) return false;
  const r = unwrapRing(ring);
  for (const shift of [0, 360, -360]) {
    const x = point.lon + shift;
    const y = point.lat;
    let inside = false;
    for (let i = 0, j = r.length - 1; i < r.length; j = i, i += 1) {
      const a = r[i];
      const b = r[j];
      if (a.lat > y !== b.lat > y && x < ((b.lon - a.lon) * (y - a.lat)) / (b.lat - a.lat) + a.lon) inside = !inside;
    }
    if (inside) return true;
  }
  return false;
}

/** Spherical polygon area in km² (the excess formula used by Turf and Leaflet.draw). */
export function areaKm2(ring) {
  if (!ring || ring.length < 3) return 0;
  const r = unwrapRing(ring);
  const rad = Math.PI / 180;
  let sum = 0;
  for (let i = 0; i < r.length; i += 1) {
    const a = r[i];
    const b = r[(i + 1) % r.length];
    sum += (b.lon - a.lon) * rad * (2 + Math.sin(a.lat * rad) + Math.sin(b.lat * rad));
  }
  return Math.abs((sum * R_KM * R_KM) / 2);
}

/** Pins inside the area, and how many per layer, largest first. */
export function areaSummary(points, ring) {
  const inside = (points || []).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon) && pointInArea(p, ring));
  const byLayer = new Map();
  for (const p of inside) byLayer.set(p.host || 'other', (byLayer.get(p.host || 'other') || 0) + 1);
  return {
    inside,
    counts: [...byLayer.entries()].map(([layer, count]) => ({ layer, count })).sort((a, b) => b.count - a.count),
    areaKm2: areaKm2(ring),
  };
}

/** The layer-supplied facts a pin carries (`d:<Label>` meta keys), as plain properties. */
function pinFacts(meta) {
  const out = {};
  for (const [k, v] of Object.entries(meta || {})) if (k.startsWith('d:') && v != null) out[k.slice(2)] = v;
  return out;
}

/** The area as a closed polygon plus every pin inside it, ready to save as a .geojson file. */
export function areaGeoJson(ring, insidePoints, opts = {}) {
  const r = unwrapRing(ring);
  const coords = r.map((c) => [Number(c.lon.toFixed(5)), Number(c.lat.toFixed(5))]);
  if (coords.length) coords.push(coords[0]);
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { kind: 'area', area_km2: Math.round(areaKm2(ring)), drawn_at: opts.drawnAt || null },
        geometry: { type: 'Polygon', coordinates: [coords] },
      },
      ...(insidePoints || []).map((p) => ({
        type: 'Feature',
        properties: { id: p.id, layer: p.host || null, label: p.label || null, ...pinFacts(p.meta) },
        geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
      })),
    ],
  };
}

/** The outline as [lon, lat] pairs for drawing; closed once the area is finished. */
export function areaOutline(ring, closed) {
  const r = unwrapRing(ring).map((c) => [c.lon, c.lat]);
  return closed && r.length >= 3 ? [...r, r[0]] : r;
}

/** Human size: "84 km²", "12,400 km²", "3.1M km²". */
export function formatArea(km2) {
  if (!Number.isFinite(km2) || km2 <= 0) return '0 km²';
  if (km2 >= 1e6) return `${(km2 / 1e6).toFixed(1)}M km²`;
  return `${Math.round(km2).toLocaleString('en-US')} km²`;
}
