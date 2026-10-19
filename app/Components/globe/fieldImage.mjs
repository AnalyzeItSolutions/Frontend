// A smooth colour field (temperature, air quality) drawn from a coarse world grid, instead of one dot per grid point.
// Pure functions: the grid is interpolated per pixel (smoothstep between neighbours, wrapping at the date line) and the rows follow the
// Web-Mercator projection, so the image lines up on the map. A pixel with no data nearby stays transparent: nothing is invented.

export const FIELD_LAYERS = new Set(['weather', 'air_quality']);
export const FIELD_LAT_TOP = 70;
export const FIELD_LAT_BOTTOM = -50;

const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const latFromMercY = (y) => ((2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180) / Math.PI;
const smooth = (t) => t * t * (3 - 2 * t);

/** @param {Array<Record<string, any>>} events @param {(e: any) => number | null | undefined} valueOf */
export function buildGrid(events, valueOf) {
  const cells = new Map();
  const lats = new Set();
  const lons = new Set();
  for (const e of events || []) {
    const v = valueOf(e);
    const lat = Number(e?.lat);
    const lon = Number(e?.lon);
    if (v == null || !Number.isFinite(Number(v)) || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    cells.set(`${lat}|${lon}`, Number(v));
    lats.add(lat);
    lons.add(lon);
  }
  return { cells, lats: [...lats].sort((a, b) => a - b), lons: [...lons].sort((a, b) => a - b) };
}

function bracket(sorted, x, wrap) {
  const n = sorted.length;
  if (n === 0) return null;
  if (n === 1) return { i0: 0, i1: 0, t: 0 };
  if (!wrap) {
    if (x <= sorted[0]) return { i0: 0, i1: 0, t: 0 };
    if (x >= sorted[n - 1]) return { i0: n - 1, i1: n - 1, t: 0 };
    let i = 0;
    while (sorted[i + 1] < x) i += 1;
    return { i0: i, i1: i + 1, t: (x - sorted[i]) / (sorted[i + 1] - sorted[i]) };
  }
  const first = sorted[0];
  const span = 360;
  let u = ((x - first) % span + span) % span + first; // into [first, first + 360)
  let i = 0;
  while (i + 1 < n && sorted[i + 1] <= u) i += 1;
  const lo = sorted[i];
  const hiRaw = i + 1 < n ? sorted[i + 1] : sorted[0] + span;
  return { i0: i, i1: (i + 1) % n, t: (u - lo) / (hiRaw - lo) };
}

/** The interpolated value at a point, or null when none of the four surrounding grid cells has data. */
export function sampleGrid(grid, lat, lon) {
  const a = bracket(grid.lats, lat, false);
  const b = bracket(grid.lons, lon, true);
  if (!a || !b) return null;
  const tx = smooth(b.t);
  const ty = smooth(a.t);
  const corners = [
    [grid.lats[a.i0], grid.lons[b.i0], (1 - ty) * (1 - tx)],
    [grid.lats[a.i0], grid.lons[b.i1], (1 - ty) * tx],
    [grid.lats[a.i1], grid.lons[b.i0], ty * (1 - tx)],
    [grid.lats[a.i1], grid.lons[b.i1], ty * tx],
  ];
  let sum = 0;
  let weight = 0;
  for (const [la, lo, w] of corners) {
    const v = grid.cells.get(`${la}|${lo}`);
    if (v == null || w <= 0) continue;
    sum += v * w;
    weight += w;
  }
  return weight > 0.0001 ? sum / weight : null;
}

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/**
 * Rasterise the field to RGBA. `colorOf(value)` returns '#rrggbb'.
 * @returns {{ width: number, height: number, data: Uint8ClampedArray }}
 */
export function renderField({ events, valueOf, colorOf, width = 720, latTop = FIELD_LAT_TOP, latBottom = FIELD_LAT_BOTTOM, alpha = 150 }) {
  const grid = buildGrid(events, valueOf);
  const yTop = mercY(latTop);
  const yBottom = mercY(latBottom);
  const height = Math.max(1, Math.round((width * (yTop - yBottom)) / (2 * Math.PI)));
  const data = new Uint8ClampedArray(width * height * 4);
  if (!grid.cells.size) return { width, height, data };
  for (let j = 0; j < height; j += 1) {
    const lat = latFromMercY(yTop - ((j + 0.5) / height) * (yTop - yBottom));
    // Soft edge where the world grid ends, so the field does not stop on a hard line.
    const edge = Math.min(1, Math.max(0, Math.min(latTop - lat, lat - latBottom) / 6));
    for (let i = 0; i < width; i += 1) {
      const lon = -180 + ((i + 0.5) / width) * 360;
      const v = sampleGrid(grid, lat, lon);
      if (v == null) continue;
      const hex = colorOf(v);
      if (!hex) continue;
      const [r, g, b] = hexToRgb(hex);
      const o = (j * width + i) * 4;
      data[o] = r;
      data[o + 1] = g;
      data[o + 2] = b;
      data[o + 3] = Math.round(alpha * edge);
    }
  }
  return { width, height, data };
}

/** The image's four corners as [lon, lat], clockwise from top-left, for a MapLibre image source. */
export function fieldCoordinates(latTop = FIELD_LAT_TOP, latBottom = FIELD_LAT_BOTTOM) {
  return [[-180, latTop], [180, latTop], [180, latBottom], [-180, latBottom]];
}
