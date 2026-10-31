/**
 * The person's own places (My data pins) against the live world: what is near each one right now.
 * Pure and dependency-free so Node's test runner can import it.
 */

/** How close counts as "near", per layer, in km: a quake is felt far away, a fire cell or a news city is local. */
export const NEAR_KM = {
  earthquakes: 300,
  disasters: 300,
  storms: 500,
  weather_alerts: 100,
  wildfires: 100,
  hotspots: 50,
  volcanoes: 150,
  news_events: 25,
  ports: 50,
};

const R = 6371;

export function distanceKm(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * @param {Array<{ id: string, lat: number, lon: number, label?: string, host?: string }>} points every pin on the globe
 * @param {{ limitPlaces?: number, limitPerPlace?: number }} [opts]
 * @returns {Array<{ place: object, near: Array<{ point: object, km: number }> }>} places with something near, most first
 */
export function nearMyPlaces(points, opts = {}) {
  const mine = (points || []).filter((p) => p.host === 'my_data' && Number.isFinite(p.lat) && Number.isFinite(p.lon));
  const world = (points || []).filter((p) => NEAR_KM[p.host] && Number.isFinite(p.lat) && Number.isFinite(p.lon));
  if (!mine.length || !world.length) return [];
  const out = [];
  for (const place of mine) {
    const near = [];
    for (const point of world) {
      // A cheap box test first: 1 degree of latitude is ~111 km.
      const reach = NEAR_KM[point.host];
      if (Math.abs(point.lat - place.lat) * 111 > reach) continue;
      const km = distanceKm(place, point);
      if (km <= reach) near.push({ point, km: Math.round(km) });
    }
    if (near.length) {
      near.sort((a, b) => a.km - b.km);
      out.push({ place, near: near.slice(0, opts.limitPerPlace ?? 5), total: near.length });
    }
  }
  out.sort((a, b) => b.total - a.total);
  return out.slice(0, opts.limitPlaces ?? 12);
}
