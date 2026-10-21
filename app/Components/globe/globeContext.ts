import { createContext, useContext, type Dispatch, type SetStateAction } from 'react';
import type {
  ChatRunIngest,
  GlobeCamera,
  GlobeDataView,
  GlobeVariant,
  MapProjectionMode,
  OverlayPath,
  RasterOverlay,
  QueuedFly,
  SourcePoint,
} from './types';

export type MountId = 'mini' | 'full';

export interface MountRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface GlobeContextValue {
  variant: GlobeVariant;
  camera: GlobeCamera;
  activePoints: SourcePoint[];
  archivePoints: SourcePoint[];
  selectedPoint: SourcePoint | null;
  inFlight: boolean;
  pendingFlyTarget: SourcePoint | null;
  flyCallout: string | null;
  queuedFlights: QueuedFly[];
  mapReady: boolean;
  transitioning: boolean;
  registerMount: (id: MountId, el: HTMLElement | null) => void;
  flyTo: (
    point: SourcePoint,
    opts?: { zoom?: number; user?: boolean },
  ) => Promise<void>;
  flyToLatLon: (
    lat: number,
    lon: number,
    opts?: { zoom?: number; name?: string; country?: string; hub?: string | null; user?: boolean },
  ) => void;
  selectPoint: (point: SourcePoint | null) => void;
  beginChatRun: () => void;
  ingestChatRun: (input: ChatRunIngest) => void;
  expandToFull: () => void;
  consumeQueuedFly: (id: string) => void;
  dismissQueuedFly: (id: string) => void;
  setComparePlaces: (places: Array<{ lat: number; lon: number; name?: string }>) => void;
  comparePlaces: Array<{ lat: number; lon: number; name?: string }>;
  /** Live event overlays (earthquakes, flights, …) from the full Globe page. */
  overlayPoints: SourcePoint[];
  setOverlayPoints: Dispatch<SetStateAction<SourcePoint[]>>;
  overlayPaths: OverlayPath[];
  setOverlayPaths: Dispatch<SetStateAction<OverlayPath[]>>;
  /** Live raster imagery (radar, satellite) drawn under the pins. */
  overlayRasters: RasterOverlay[];
  setOverlayRasters: Dispatch<SetStateAction<RasterOverlay[]>>;
  showCatalog: boolean;
  setShowCatalog: (on: boolean) => void;
  /** The person's "rotate when idle" switch (remembered), and whether something currently holds it still. */
  autoRotate: boolean;
  setAutoRotate: (on: boolean) => void;
  setRotateHold: (hold: boolean) => void;
  mapProjection: MapProjectionMode;
  setMapProjection: (mode: MapProjectionMode) => void;
  dataView: GlobeDataView;
  setDataView: (view: GlobeDataView) => void;
  activeHub: string | null;
  setActiveHub: (name: string | null) => void;
  onMapPlaceSelect?: (place: {
    lat: number;
    lon: number;
    name?: string;
    event?: SourcePoint;
  }) => void;
  setOnMapPlaceSelect: (
    fn: ((place: { lat: number; lon: number; name?: string; event?: SourcePoint }) => void) | null,
  ) => void;
  /**
   * Widget→Globe bridge: call from a metric widget that has lat/lng data
   * to fly the globe to that location.
   * e.g. an earthquake metric → broadcastFocus(lat, lng, 'M6.2 near Tokyo')
   */
  broadcastFocus: (lat: number, lng: number, label?: string) => void;
  /**
   * Globe→Widget bridge: register a callback that fires when the user clicks
   * a country/place on the globe, so the dashboard cross-filter can react.
   * Pass null to deregister.
   */
  setOnGlobeClick: (
    cb: ((lat: number, lng: number, label?: string) => void) | null,
  ) => void;
}


export const GlobeContext = createContext<GlobeContextValue | null>(null);

export function useGlobe(): GlobeContextValue {
  const ctx = useContext(GlobeContext);
  if (!ctx) {
    throw new Error('useGlobe must be used within GlobeProvider');
  }
  return ctx;
}

/** Safe on pages that may render before the provider hydrates. */
export function useGlobeOptional(): GlobeContextValue | null {
  return useContext(GlobeContext);
}
