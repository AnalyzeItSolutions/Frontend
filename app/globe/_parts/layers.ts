import type { PlaceContext } from '../../lib/geoApi';
import { LAYER_COLORS } from '../../Components/globe/layerColors.mjs';

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

/** `truncated`: the source hit its row cap, so the oldest part of the window is missing. */
export type LayerHealth = { status: string; message?: string | null; truncated?: boolean };

export const LAYERS: { id: LayerId; label: string; hint: string; color: string; coverage: 'complete' | 'limited' }[] = [
  { id: 'catalog', label: 'Sources', hint: 'Where agencies and statistics offices sit — a fixed reference list, not live data', color: LAYER_COLORS.catalog, coverage: 'limited' },
  { id: 'earthquakes', label: 'Earthquakes', hint: 'USGS M2.5+ · every quake in the window, updated by the minute', color: LAYER_COLORS.earthquakes, coverage: 'complete' },
  { id: 'disasters', label: 'Disasters', hint: 'GDACS alerts worldwide', color: LAYER_COLORS.disasters, coverage: 'complete' },
  { id: 'wildfires', label: 'Wildfires', hint: 'NASA EONET open fires', color: LAYER_COLORS.wildfires, coverage: 'complete' },
  { id: 'storms', label: 'Storms', hint: 'NASA EONET severe storms', color: LAYER_COLORS.storms, coverage: 'complete' },
  { id: 'volcanoes', label: 'Volcanoes', hint: 'NASA EONET volcanoes', color: LAYER_COLORS.volcanoes, coverage: 'complete' },
  { id: 'weather', label: 'Weather', hint: 'Live temperature, wind, cloud and rain on a 10° world grid · refreshed every 3 h', color: LAYER_COLORS.weather, coverage: 'complete' },
  { id: 'air_quality', label: 'Air quality', hint: 'Live AQI and PM2.5 on a 10° world grid · refreshed every 3 h', color: LAYER_COLORS.air_quality, coverage: 'complete' },
  { id: 'iss', label: 'Satellites', hint: 'ISS + selected Celestrak sats — not a full catalog', color: LAYER_COLORS.iss, coverage: 'limited' },
  { id: 'radar', label: 'Rain radar', hint: 'Live precipitation radar mosaic (RainViewer) · refreshed every 10 min', color: LAYER_COLORS.radar, coverage: 'complete' },
  { id: 'clouds', label: 'Live clouds', hint: 'GOES-East and Himawari satellite imagery (NASA GIBS) · refreshed every 10 min · Americas, Atlantic, East Asia and Oceania', color: LAYER_COLORS.clouds, coverage: 'limited' },
  { id: 'space_weather', label: 'Space Weather', hint: 'NOAA SWPC alerts · scales · flares', color: LAYER_COLORS.space_weather, coverage: 'complete' },
  { id: 'my_data', label: 'My data', hint: 'Your project’s records with a location — lat/lon fields or place names', color: LAYER_COLORS.my_data, coverage: 'complete' },
  { id: 'weather_alerts', label: 'Severe alerts', hint: 'US National Weather Service · severe & extreme with a mapped area', color: LAYER_COLORS.weather_alerts, coverage: 'limited' },
  { id: 'ocean', label: 'Ocean buoys', hint: 'NOAA NDBC waves & wind · stations that report', color: LAYER_COLORS.ocean, coverage: 'limited' },
  { id: 'aurora_oval', label: 'Aurora oval', hint: 'NOAA OVATION forecast · cells at 5%+', color: LAYER_COLORS.aurora_oval, coverage: 'complete' },
  { id: 'fireballs', label: 'Fireballs', hint: 'NASA CNEOS bolides · last 6 months', color: LAYER_COLORS.fireballs, coverage: 'limited' },
  { id: 'markets', label: 'Markets', hint: 'Live headline index of each major exchange country', color: LAYER_COLORS.markets, coverage: 'limited' },
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
