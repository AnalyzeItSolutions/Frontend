import type { PlaceContext } from '../../lib/geoApi';
import { LAYER_COLORS } from '../../Components/globe/layerColors.mjs';
import { DEFAULT_ON, LAYER_CATALOG } from '../../Components/globe/layerCatalog.mjs';

export type Selected = { lat: number; lon: number; name?: string; country?: string };
export type ComparePlace = Selected & { id: string; context?: PlaceContext | null };

export type LayerId =
  | 'catalog'
  | 'earthquakes'
  | 'wildfires'
  | 'storms'
  | 'volcanoes'
  | 'disasters'
  | 'weather'
  | 'air_quality'
  | 'markets'
  | 'iss'
  | 'space_weather'
  | 'radar'
  | 'clouds'
  | 'my_data'
  | 'fireballs'
  | 'aurora_oval'
  | 'ocean'
  | 'weather_alerts'
  | 'flights'
  | 'hotspots'
  | 'news_events'
  | 'orbits'
  | 'ports'
  | 'wind';

/** `truncated`: the source hit its row cap, so the oldest part of the window is missing. */
export type LayerHealth = { status: string; message?: string | null; truncated?: boolean };

export type LayerGroup = 'mine' | 'live' | 'weather' | 'hazards' | 'space' | 'trade';
export const LAYERS: { id: LayerId; label: string; hint: string; color: string; group: LayerGroup; coverage: 'complete' | 'limited' }[] = (
  LAYER_CATALOG as Array<{ id: LayerId; label: string; hint: string; group: LayerGroup; coverage: 'complete' | 'limited' }>
).map((l) => ({ ...l, color: (LAYER_COLORS as Record<string, string>)[l.id] }));

export const DEFAULT_LAYERS = Object.fromEntries(
  LAYERS.map((l) => [l.id, (DEFAULT_ON as string[]).includes(l.id)]),
) as Record<LayerId, boolean>;

/** Layers backed by a server request (radar/clouds are tiles, catalog is a fixed list). */
export const LIVE_LAYER_IDS: LayerId[] = [
  'earthquakes',
  'disasters',
  'wildfires',
  'storms',
  'volcanoes',
  'weather',
  'air_quality',
  'markets',
  'iss',
  'space_weather',
  'my_data',
  'fireballs',
  'aurora_oval',
  'ocean',
  'weather_alerts',
  'flights',
  'hotspots',
  'news_events',
  'orbits',
  'ports',
  'wind',
];

export const isRasterLayer = (id: LayerId) => id === 'radar' || id === 'clouds';

export function placeId(p: { lat: number; lon: number; name?: string }) {
  return `${(p.name || 'p').toLowerCase()}-${p.lat.toFixed(3)}-${p.lon.toFixed(3)}`;
}

export function placeLabel(p: { lat: number; lon: number; name?: string }) {
  return p.name || `${p.lat.toFixed(2)}, ${p.lon.toFixed(2)}`;
}

export function kpis(ctx: PlaceContext | null | undefined) {
  const temp = ctx?.weather?.temperature_c;
  const aqi = ctx?.air_quality?.us_aqi ?? ctx?.air_quality?.european_aqi;
  const market = ctx?.market?.index_symbol || ctx?.market?.index_name;
  return [
    { label: 'Temp', value: temp != null ? `${Math.round(temp)}°C` : '—' },
    { label: 'AQI', value: aqi != null ? String(aqi) : '—' },
    { label: 'Market', value: market || '—' },
  ];
}
