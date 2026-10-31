/**
 * The dashboard widget a Globe view becomes: its layers (those the dashboard globe can draw), where it was looking and the area on it.
 * Pure so Node's test runner can import it.
 */

import { LAYER_CATALOG } from './layerCatalog.mjs';

const LABEL = Object.fromEntries(LAYER_CATALOG.map((l) => [l.id, l.label]));

/** Drawn on the web Globe only: colour fields, imagery, the catalogue and the person's own records. */
export const WEB_ONLY_LAYERS = new Set(['catalog', 'radar', 'clouds', 'my_data', 'weather', 'air_quality']);

/**
 * @param {{ id: string, layers: string[], view?: { lat: number, lng: number, zoom: number } | null, outline?: Array<[number, number]> | null, title?: string, now?: Date }} input
 */
export function globeWidgetSpec({ id, layers, view, outline, title, now = new Date() }) {
  const usable = [...new Set(layers || [])].filter((l) => !WEB_ONLY_LAYERS.has(l));
  if (!usable.length) throw new Error('Turn on a live layer (earthquakes, flights, fires, news…) to put this view on a dashboard.');
  const props = { layers: usable };
  if (view && Number.isFinite(view.lat) && Number.isFinite(view.lng)) {
    props.center = { lat: Number(view.lat.toFixed(3)), lon: Number(view.lng.toFixed(3)), zoom: Number((view.zoom ?? 1.3).toFixed(2)) };
  }
  if (Array.isArray(outline) && outline.length >= 3) props.outline = outline.map(([lon, lat]) => [Number(lon.toFixed(4)), Number(lat.toFixed(4))]);
  return {
    id,
    type: 'globe_view',
    component: 'globe_view',
    render_mode: 'native',
    title: (title || '').trim().slice(0, 80) || `Live globe: ${usable.slice(0, 3).map((l) => LABEL[l] || l).join(', ')}`,
    span: 2,
    props,
    freshness: 'Live · refreshed every minute',
    provenance: { kind: 'live_public_data', source: 'AnalyzeIt globe (USGS, NASA, NOAA, GDELT, OpenSky/adsb.lol and others)', timestamp: now.toISOString() },
  };
}
