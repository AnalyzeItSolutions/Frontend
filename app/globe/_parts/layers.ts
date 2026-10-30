import type { PlaceContext } from '../../lib/geoApi';
import { LAYER_COLORS } from '../../Components/globe/layerColors.mjs';
import { LAYER_CATALOG } from '../../Components/globe/layerCatalog.mjs';

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

export const LAYERS: { id: LayerId; label: string; hint: string; color: string; coverage: 'complete' | 'limited' }[] = (
  LAYER_CATALOG as Array<{ id: LayerId; label: string; hint: string; coverage: 'complete' | 'limited' }>
).map((l) => ({ ...l, color: (LAYER_COLORS as Record<string, string>)[l.id] }));

export const DEFAULT_LAYERS: Record<LayerId, boolean> = {
  catalog: false,
  earthquakes: true,
  disasters: false,
  wildfires: false,
  storms: false,
  volcanoes: false,
  weather: true,
  air_quality: false,
  markets: false,
  iss: false,
  space_weather: false,
  radar: false,
  clouds: false,
  my_data: false,
  fireballs: false,
  aurora_oval: false,
  ocean: false,
  weather_alerts: false,
  flights: false,
  hotspots: false,
  news_events: false,
  orbits: false,
  ports: false,
  wind: false,
};

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
