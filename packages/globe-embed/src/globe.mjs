/**
 * The AnalyzeIt globe as a plain module for products that are not the Next.js site: the desktop app, the browser
 * extension and any other page. Same layers, colours and wording as the web Globe, from the same modules.
 *
 *   const globe = createGlobe(el, { fetchLayer, basemap, workerUrl, layers: ['earthquakes'] });
 *
 * `fetchLayer(id)` returns the layer payload exactly as `GET /v1/geo/events?layers=<id>` puts it under
 * `layers[id]`; each product fetches it its own way (desktop through core, extension through its API client).
 * The base map is a local Natural Earth file, so the globe needs no tile server and works offline.
 */

import * as maplibregl from 'maplibre-gl';
import { interpretLayerPayload, mergeLayerRefresh } from '../../../app/Components/globe/dataQuality.mjs';
import { LAYER_CATALOG } from '../../../app/Components/globe/layerCatalog.mjs';
import { LAYER_COLORS } from '../../../app/Components/globe/layerColors.mjs';
import { DENSE_LAYERS, buildLiveOverlays } from '../../../app/Components/globe/liveOverlays.mjs';

/** Layers the embed can draw: weather and air quality are colour fields and radar/clouds are imagery (web only). */
const WEB_ONLY = new Set(['catalog', 'radar', 'clouds', 'my_data', 'weather', 'air_quality']);
export const EMBED_LAYERS = LAYER_CATALOG.filter((l) => !WEB_ONLY.has(l.id)).map((l) => ({ ...l, color: LAYER_COLORS[l.id] }));

const THEMES = {
  dark: { space: '#0b0d10', water: '#11161c', land: '#232b36', border: '#3d4856', ring: '#ffffff' },
  light: { space: '#eef1f4', water: '#dfe7ee', land: '#f8f9fa', border: '#b8c2cc', ring: '#1f2937' },
};

function style(basemap, theme) {
  const t = THEMES[theme] || THEMES.dark;
  return {
    version: 8,
    projection: { type: 'globe' },
    sources: {
      land: { type: 'geojson', data: basemap },
      lines: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
      pins: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
    },
    layers: [
      { id: 'water', type: 'background', paint: { 'background-color': t.water } },
      { id: 'land', type: 'fill', source: 'land', paint: { 'fill-color': t.land } },
      { id: 'borders', type: 'line', source: 'land', paint: { 'line-color': t.border, 'line-width': 0.6 } },
      {
        id: 'lines', type: 'line', source: 'lines',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ['get', 'color'], 'line-width': ['case', ['==', ['get', 'kind'], 'wind'], 1, 2.5], 'line-opacity': 0.8 },
      },
      { id: 'pin-hit', type: 'circle', source: 'pins', paint: { 'circle-radius': 8, 'circle-opacity': 0 } },
      {
        id: 'pins', type: 'circle', source: 'pins',
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': ['case', ['get', 'dense'], 2.2, 4.5],
          'circle-stroke-width': ['case', ['get', 'dense'], 0, 1],
          'circle-stroke-color': t.ring,
          'circle-opacity': 0.92,
        },
      },
    ],
  };
}

/**
 * @param {HTMLElement} el
 * @param {{
 *   fetchLayer: (id: string) => Promise<Record<string, any>>,
 *   basemap: object | string,
 *   workerUrl?: string,
 *   layers?: string[],
 *   theme?: 'dark' | 'light',
 *   pollMs?: number,
 *   onSelect?: (pin: { id: string, layer: string, label: string, lat: number, lon: number, details: Record<string, string>, links: string[] } | null) => void,
 *   onUpdate?: (state: { counts: Record<string, number>, health: Record<string, { status: string, message?: string | null }>, loading: boolean }) => void,
 * }} opts
 */
export function createGlobe(el, opts) {
  if (opts.workerUrl) maplibregl.setWorkerUrl(opts.workerUrl);
  const map = new maplibregl.Map({
    container: el,
    style: style(opts.basemap, opts.theme),
    center: [20, 20],
    zoom: 1.3,
    attributionControl: false,   // (renderWorldCopies must stay on: with it off the globe projection draws no data)
  });
  map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: 'Natural Earth · data via AnalyzeIt' }));

  let on = new Set((opts.layers || []).filter((id) => EMBED_LAYERS.some((l) => l.id === id)));
  const cache = new Map();        // id -> { events, path, lines, status, message }
  const inflight = new Set();
  let points = [];
  let ready = false;
  let destroyed = false;

  const emit = () => {
    const counts = {};
    const health = {};
    for (const id of on) {
      const c = cache.get(id);
      if (c) health[id] = { status: c.status, message: c.message };
    }
    const merged = {};
    for (const id of on) if (cache.get(id)) merged[id] = cache.get(id);
    const flags = Object.fromEntries([...on].map((id) => [id, true]));
    const built = buildLiveOverlays(flags, merged);
    Object.assign(counts, built.counts);
    points = built.points;
    if (ready) {
      map.getSource('pins')?.setData({
        type: 'FeatureCollection',
        features: points.map((p) => ({
          type: 'Feature',
          properties: { id: p.id, color: LAYER_COLORS[p.host] || '#e4e4e2', dense: DENSE_LAYERS.has(p.host) },
          geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
        })),
      });
      map.getSource('lines')?.setData({
        type: 'FeatureCollection',
        features: built.paths.map((p) => ({
          type: 'Feature',
          properties: { color: p.color || '#f43f5e', kind: p.kind || 'track' },
          geometry: { type: 'LineString', coordinates: p.coordinates },
        })),
      });
    }
    opts.onUpdate?.({ counts, health, loading: inflight.size > 0 });
  };

  const load = async (id) => {
    if (inflight.has(id) || destroyed) return;
    inflight.add(id);
    emit();
    let payload;
    try {
      payload = await opts.fetchLayer(id);
    } catch (err) {
      payload = { fetchError: err instanceof Error ? err.message : 'Could not load layer' };
    }
    inflight.delete(id);
    if (destroyed) return;
    cache.set(id, mergeLayerRefresh(cache.get(id), interpretLayerPayload(payload)));
    emit();
  };

  map.on('load', () => {
    ready = true;
    emit();
  });

  // Hosts lay out after mounting (tabs, side panels): follow the container's size.
  const resizer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => map.resize()) : null;
  resizer?.observe(el);

  map.on('click', (e) => {
    const hit = map.queryRenderedFeatures(e.point, { layers: ['pins', 'pin-hit'] })[0];
    const p = hit && points.find((x) => x.id === hit.properties.id);
    if (!p) return opts.onSelect?.(null);
    const details = {};
    for (const [k, v] of Object.entries(p.meta || {})) if (k.startsWith('d:') && v != null) details[k.slice(2)] = String(v);
    opts.onSelect?.({ id: p.id, layer: p.host, label: p.label, lat: p.lat, lon: p.lon, details, links: p.meta?.links || [] });
  });
  map.on('mouseenter', 'pin-hit', () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', 'pin-hit', () => { map.getCanvas().style.cursor = ''; });

  const timer = setInterval(() => {
    // Nobody is looking: the window is hidden, or the host moved to another screen and hid the globe.
    if ((typeof document !== 'undefined' && document.hidden) || !el.isConnected || el.offsetParent === null) return;
    for (const id of on) void load(id);
  }, opts.pollMs || 60_000);

  for (const id of on) void load(id);

  return {
    map,
    getLayers: () => [...on],
    setLayers(ids) {
      on = new Set(ids.filter((id) => EMBED_LAYERS.some((l) => l.id === id)));
      for (const id of on) if (!cache.has(id)) void load(id);
      emit();
    },
    toggle(id) {
      const next = new Set(on);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      this.setLayers([...next]);
    },
    refresh() {
      for (const id of on) void load(id);
    },
    flyTo(lat, lon, zoom = 4) {
      map.flyTo({ center: [lon, lat], zoom, essential: true });
    },
    destroy() {
      destroyed = true;
      clearInterval(timer);
      resizer?.disconnect();
      map.remove();
    },
  };
}
