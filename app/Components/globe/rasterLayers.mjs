// Live raster imagery for the globe: weather radar and satellite clouds. Every tile is fetched by the browser straight from the
// provider (RainViewer, NASA GIBS); nothing here is sampled or stored, and a missing frame simply draws nothing.

export const RAINVIEWER_INDEX = 'https://api.rainviewer.com/public/weather-maps.json';
const GIBS = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';

/** Radar refreshes about every 10 minutes. */
export const RADAR_REFRESH_MS = 5 * 60 * 1000;

/**
 * The newest radar frame from RainViewer's index, or null when the index has none.
 * @param {{ host?: string, radar?: { past?: Array<{ time: number, path: string }> } } | null | undefined} index
 */
export function radarRaster(index) {
  const frames = index?.radar?.past;
  const host = typeof index?.host === 'string' ? index.host : '';
  if (!host.startsWith('https://') || !Array.isArray(frames) || frames.length === 0) return null;
  const latest = frames[frames.length - 1];
  if (!latest || typeof latest.path !== 'string' || !latest.path.startsWith('/')) return null;
  return {
    id: 'radar',
    tiles: [`${host}${latest.path}/256/{z}/{x}/{y}/2/1_1.png`],
    tileSize: 256,
    maxzoom: 7,
    opacity: 0.8,
    attribution: 'Radar © RainViewer',
    time: latest.time,
  };
}

/** GOES-East (the Americas and Atlantic, true colour) and Himawari (East Asia and Oceania, infrared clouds), both updated every ~10 minutes. */
export function satelliteRasters() {
  return [
    {
      id: 'goes-east',
      tiles: [`${GIBS}/GOES-East_ABI_GeoColor/default/default/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png`],
      tileSize: 256,
      maxzoom: 7,
      opacity: 0.85,
      attribution: 'GOES-East © NOAA / NASA GIBS',
    },
    {
      id: 'himawari',
      tiles: [`${GIBS}/Himawari_AHI_Band13_Clean_Infrared/default/default/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`],
      tileSize: 256,
      maxzoom: 6,
      opacity: 0.8,
      attribution: 'Himawari © JMA / NASA GIBS',
    },
  ];
}

/** The rasters to draw for the toggled layers, in draw order (satellite under radar). */
export function activeRasters(enabled, radarIndex) {
  const out = [];
  if (enabled?.clouds) out.push(...satelliteRasters());
  if (enabled?.radar) {
    const radar = radarRaster(radarIndex);
    if (radar) out.push(radar);
  }
  return out;
}
