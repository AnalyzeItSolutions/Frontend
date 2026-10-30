export type GlobeVariant = 'mini' | 'full' | 'parked';

export type SourceKind = 'live' | 'archive' | 'hub' | 'place' | 'event';

export type SourceTier = 'trusted' | 'candidate';

export type MapProjectionMode = 'globe' | 'mercator';

/** How live points are drawn. All modes use the same overlay payload. */
export type GlobeDataView = 'pins' | 'heat' | 'density' | 'bars';

export interface SourcePoint {
  id: string;
  lat: number;
  lon: number;
  label: string;
  source_id?: string;
  host?: string;
  kind: SourceKind;
  tier?: SourceTier;
  pulse?: boolean;
  /** Show a text chip beside the pin (live event layers). */
  showLabel?: boolean;
  /** Extra fields for flight / satellite detail cards. */
  meta?: Record<string, string | number | boolean | null | undefined>;
  /** Aircraft category for icon: airliner | heavy | jet | heli | light | uav | unknown */
  category?: string;
  /** Heading degrees for rotating flight icons */
  trackDeg?: number;
}

/** GeoJSON-ready path overlay (e.g. ISS ground track). coords are [lon, lat]. */
export interface OverlayPath {
  id: string;
  coordinates: Array<[number, number]>;
  color?: string;
  /** 'wind' streamlines are drawn thin, one colour per line; anything else is a track like the ISS orbit. */
  kind?: 'wind' | 'area';
}

/** A live raster layer drawn under the pins (weather radar, satellite cloud imagery). */
export interface RasterOverlay {
  id: string;
  /** Tiled imagery (radar, satellite). */
  tiles?: string[];
  /** A single georeferenced picture (a smooth weather or air-quality field); coordinates are [lon, lat], clockwise from top-left. */
  image?: { url: string; coordinates: [number, number][] };
  tileSize?: number;
  maxzoom?: number;
  opacity?: number;
  attribution?: string;
}

export interface GlobeCamera {
  lat: number;
  lng: number;
  zoom: number;
}

export interface QueuedFly {
  id: string;
  point: SourcePoint;
}

export interface GlobeMapHandle {
  flyTo: (opts: { lat: number; lon: number; zoom?: number }) => Promise<void>;
  resize: () => void;
  getView: () => GlobeCamera;
  pause: () => void;
  resume: () => void;
}

export interface ChatRunIngest {
  /** Real subjects of the answer (countries, cities, events) with coordinates. */
  places?: Array<{ name: string; lat: number; lon: number }>;
  query?: string;
  city?: string;
  lat?: number;
  lon?: number;
  name?: string;
  sources?: Array<{
    host: string;
    url?: string;
    title?: string;
    lat?: number;
    lng?: number;
    lon?: number;
    source_id?: string;
    category?: string;
  }>;
}

export const DEFAULT_CAMERA: GlobeCamera = {
  lat: 18,
  lng: 20,
  zoom: 1.35,
};
