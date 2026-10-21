import type * as GeoJSON from 'geojson';
import type { CircleLayerSpecification, HeatmapLayerSpecification } from 'maplibre-gl';
import { LAYER_COLORS } from '../globe/layerColors.mjs';
import { eventDrawWeight, strongestRows } from '../globe/dataQuality.mjs';
import { valueColor } from '../globe/pinColors.mjs';
import type { SourcePoint } from '../globe/types';

/** The three alternatives to pins (Heat, Density, Bars) all draw the same weighted points. */
export function metricGeoJson(points: SourcePoint[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  for (const p of points) {
    const w = eventDrawWeight(p);
    if (w == null) continue;
    features.push({
      type: 'Feature',
      properties: { id: p.id, w, label: p.label },
      geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
    });
  }
  return { type: 'FeatureCollection', features };
}

export const HEAT_LAYER: HeatmapLayerSpecification = {
  id: 'globe-metric-heat',
  type: 'heatmap',
  source: 'globe-metric',
  paint: {
    'heatmap-weight': ['interpolate', ['linear'], ['get', 'w'], 0, 0.15, 1, 1],
    // Wide at world zoom so a few hundred events read as regions, tighter as you zoom into them.
    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1.1, 3, 1.5, 6, 1.9],
    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 24, 2, 34, 4, 46, 8, 66],
    'heatmap-opacity': 0.86,
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0,
      'rgba(0,0,0,0)',
      0.15,
      'rgba(125,211,252,0.5)',
      0.35,
      '#34d399',
      0.6,
      '#fbbf24',
      0.85,
      '#f97316',
      1,
      '#ef4444',
    ],
  },
};

export const DENSITY_LAYER: CircleLayerSpecification = {
  id: 'globe-metric-density',
  type: 'circle',
  source: 'globe-metric',
  paint: {
    'circle-radius': [
      'interpolate',
      ['linear'],
      ['zoom'],
      0,
      ['+', 7, ['*', ['get', 'w'], 14]],
      4,
      ['+', 10, ['*', ['get', 'w'], 30]],
      8,
      ['+', 14, ['*', ['get', 'w'], 46]],
    ],
    'circle-color': ['interpolate', ['linear'], ['get', 'w'], 0.3, '#7dd3fc', 0.6, '#fbbf24', 1, '#ef4444'],
    'circle-opacity': 0.4,
    'circle-blur': 0.85,
    'circle-stroke-width': 0,
  },
};

export type BarRow = { point: SourcePoint; w: number; color: string; labelled: boolean };

/**
 * The strongest points as bars: the top few carry a label, every bar takes its colour from the value (magnitude,
 * temperature…) or else its layer, so a field of bars stays readable instead of a pile of overlapping text.
 */
export function barRows(points: SourcePoint[], maxBars = 36, labelTop = 8): BarRow[] {
  const ranked = strongestRows(points, maxBars) as { rows: Array<{ id: string; score: number }> };
  const max = ranked.rows[0]?.score || 1;
  const byId = new globalThis.Map(points.map((p) => [p.id, p]));
  const rows: BarRow[] = [];
  ranked.rows.forEach((row, i) => {
    const point = byId.get(row.id);
    if (!point) return;
    const host = String(point.host || '');
    const color = (valueColor(host, point.meta as Record<string, unknown> | undefined) as string | null) || LAYER_COLORS[host] || '#E4E4E2';
    rows.push({ point, w: row.score / max, color, labelled: i < labelTop });
  });
  return rows;
}
