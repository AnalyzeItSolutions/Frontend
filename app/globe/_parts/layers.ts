import type { PlaceContext } from '../../lib/geoApi';

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
  | 'weather_alerts';

export type LayerHealth = { status: string; message?: string | null };

export const LAYERS: { id: LayerId; label: string; hint: string; color: string; coverage: 'complete' | 'limited' }[] = [
  { id: 'catalog', label: 'Sources', hint: 'Where agencies and statistics offices sit — a fixed reference list, not live data', color: '#A7A7A7', coverage: 'limited' },
  { id: 'earthquakes', label: 'Earthquakes', hint: 'USGS M2.5+ · every quake in the window, updated by the minute', color: '#d97706', coverage: 'complete' },
  { id: 'disasters', label: 'Disasters', hint: 'GDACS alerts worldwide', color: '#dc2626', coverage: 'complete' },
  { id: 'wildfires', label: 'Wildfires', hint: 'NASA EONET open fires', color: '#ef4444', coverage: 'complete' },
  { id: 'storms', label: 'Storms', hint: 'NASA EONET severe storms', color: '#E4E4E2', coverage: 'complete' },
  { id: 'volcanoes', label: 'Volcanoes', hint: 'NASA EONET volcanoes', color: '#b45309', coverage: 'complete' },
  { id: 'weather', label: 'Weather', hint: 'Live temperature, wind, cloud and rain on a 10° world grid · refreshed every 3 h', color: '#f59e0b', coverage: 'complete' },
  { id: 'air_quality', label: 'Air quality', hint: 'Live AQI and PM2.5 on a 10° world grid · refreshed every 3 h', color: '#10b981', coverage: 'complete' },
  { id: 'iss', label: 'Satellites', hint: 'ISS + selected Celestrak sats — not a full catalog', color: '#f43f5e', coverage: 'limited' },
  { id: 'radar', label: 'Rain radar', hint: 'Live precipitation radar mosaic (RainViewer) · refreshed every 10 min', color: '#38bdf8', coverage: 'complete' },
  { id: 'clouds', label: 'Live clouds', hint: 'GOES-East and Himawari satellite imagery (NASA GIBS) · refreshed every 10 min · Americas, Atlantic, East Asia and Oceania', color: '#cbd5e1', coverage: 'limited' },
  { id: 'space_weather', label: 'Space Weather', hint: 'NOAA SWPC alerts · scales · flares', color: '#14b8a6', coverage: 'complete' },
  { id: 'my_data', label: 'My data', hint: 'Your project’s records with a location — lat/lon fields or place names', color: '#E4E4E2', coverage: 'complete' },
  { id: 'weather_alerts', label: 'Severe alerts', hint: 'US National Weather Service · severe & extreme with a mapped area', color: '#f97316', coverage: 'limited' },
  { id: 'ocean', label: 'Ocean buoys', hint: 'NOAA NDBC waves & wind · stations that report', color: '#0ea5e9', coverage: 'limited' },
  { id: 'aurora_oval', label: 'Aurora oval', hint: 'NOAA OVATION forecast · cells at 5%+', color: '#22c55e', coverage: 'complete' },
  { id: 'fireballs', label: 'Fireballs', hint: 'NASA CNEOS bolides · last 6 months', color: '#fb7185', coverage: 'limited' },
  { id: 'markets', label: 'Markets', hint: 'Live headline index of each major exchange country', color: '#8b5cf6', coverage: 'limited' },
];

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
