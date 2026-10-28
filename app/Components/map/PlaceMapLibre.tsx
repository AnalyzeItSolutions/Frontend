'use client';

import { valueColor } from '../globe/pinColors.mjs';
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, forwardRef } from 'react';
import type * as GeoJSON from 'geojson';
import { loadMapConfig } from './mapConfig';
import { sameKeySet } from './facingSet.mjs';
import { isLayerKind, selectedSourceId, sourcePinFeatures } from './sourcePinsGl.mjs';
import Map, { Marker, Source, Layer, type MapRef } from 'react-map-gl/maplibre';
import type { CircleLayerSpecification, LineLayerSpecification, Map as MapLibreMap, StyleSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTheme } from '../ui/ThemeProvider';
import { BarMarkers } from './BarMarkers';
import { DENSITY_LAYER, HEAT_LAYER, barRows, metricGeoJson } from './metricModes';
import { globeAtmosphere, globeBasemapTheme, globeStage } from '../globe/globeVisual.mjs';
import { GLOBE_HUBS } from '../globe/sourceCatalog';
import { currentTierSettings, fullPixelRatio, miniPixelRatio } from '../globe/globePerf';
import type {
  GlobeCamera,
  GlobeDataView,
  GlobeMapHandle,
  GlobeVariant,
  MapProjectionMode,
  OverlayPath,
  RasterOverlay,
  SourcePoint,
} from '../globe/types';
import { ensureMapLibreWorker, isVisibleOnGlobe } from './maplibreSetup';

import { LAYER_COLORS } from '../globe/layerColors.mjs';
import { flyEase } from './mapMotion';
import { OrbitSvgOverlay } from './OrbitSvgOverlay';
import { EventMarker, SourcePin } from './MapMarkers';
import { pauseMapLoop, resumeMapLoop } from './mapLoop';
import { useAutoRotate } from './useAutoRotate';
import { ensurePlaneIcon } from './mapImages';

ensureMapLibreWorker();

export { GLOBE_HUBS };

export interface MapPlaceSelection {
  lat: number;
  lon: number;
  name?: string;
  country?: string;
  /** When set, this is a live overlay event — not a place reverse-geocode. */
  event?: SourcePoint;
}

interface PlaceMapLibreProps {
  onPlaceSelect?: (place: MapPlaceSelection) => void;
  selected?: MapPlaceSelection | null;
  activeHub?: string | null;
  onHubSelect?: (hub: (typeof GLOBE_HUBS)[number]) => void;
  flyTo?: { lat: number; lon: number; zoom?: number } | null;
  comparePlaces?: Array<{ lat: number; lon: number; name?: string }>;
  sourcePoints?: SourcePoint[];
  overlayPaths?: OverlayPath[];
  overlayRasters?: RasterOverlay[];
  hideNavControl?: boolean;
  hideChrome?: boolean;
  className?: string;
  onMapError?: (message: string) => void;
  onMapReady?: () => void;
  onEngineReady?: (handle: GlobeMapHandle) => void;
  variant?: GlobeVariant;
  idleDrift?: boolean;
  /** Slow idle rotation on the full globe; the provider decides when it may run. */
  autoRotate?: boolean;
  inFlight?: boolean;
  flyEasing?: (t: number) => number;
  initialCamera?: GlobeCamera;
  /** Stop the MapLibre render loop (parked / hidden tab). */
  paused?: boolean;
  /** Skip canvas realloc while a FLIP resize animation is in flight. */
  freezeResize?: boolean;
  /** Geographic basemap projection — globe sphere or flat mercator. */
  mapProjection?: MapProjectionMode;
  /** pins | heat | density | bars — same points, different drawing. */
  dataView?: GlobeDataView;
}

type MapConfig = {
  provider: 'locationiq' | 'openfreemap';
  theme?: string;
  mapStyle: string | StyleSpecification;
};

const FACING_MIN_INTERVAL_MS = 120;
const OPENFREEMAP_LIGHT = 'https://tiles.openfreemap.org/styles/liberty';
const OPENFREEMAP_DARK = 'https://tiles.openfreemap.org/styles/dark';


export const PlaceMapLibre = forwardRef<GlobeMapHandle, PlaceMapLibreProps>(function PlaceMapLibre(
  {
    onPlaceSelect,
    selected,
    activeHub: _activeHub,
    onHubSelect,
    flyTo,
    comparePlaces = [],
    sourcePoints = [],
    overlayPaths = [],
    overlayRasters = [],
    hideNavControl: _hideNavControl = false,
    hideChrome = false,
    className = '',
    onMapError,
    onMapReady,
    onEngineReady,
    variant = 'full',
    idleDrift = false,
    autoRotate = false,
    inFlight = false,
    flyEasing,
    initialCamera,
    paused = false,
    freezeResize = false,
    mapProjection = 'globe',
    dataView = 'pins',
  },
  ref,
) {
  const mapRef = useRef<MapRef | null>(null);
  const { theme } = useTheme();
  const appTheme = theme === 'dark' ? 'dark' : 'light';
  const basemapTheme = globeBasemapTheme({ variant, appTheme });
  const stage = globeStage({ variant, appTheme });
  const [config, setConfig] = useState<MapConfig | null>(null);
  const [mapInstance, setMapInstance] = useState<MapLibreMap | null>(null);
  const [frontKeys, setFrontKeys] = useState<Set<string> | null>(null);
  const frontKeysRef = useRef<Set<string> | null>(null);
  const flyGenRef = useRef(0);
  const engineReadyRef = useRef(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    ensureMapLibreWorker();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setConfig(null);
    engineReadyRef.current = false;
    void loadMapConfig(basemapTheme)
      .then((data) => {
        if (!cancelled) setConfig(data);
      })
      .catch(() => {
        if (!cancelled) {
          setConfig({
            provider: 'openfreemap',
            theme: basemapTheme,
            mapStyle: basemapTheme === 'dark' ? OPENFREEMAP_DARK : OPENFREEMAP_LIGHT,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [basemapTheme]);

  const getMap = useCallback((): MapLibreMap | null => {
    const wrapped = mapRef.current;
    if (!wrapped) return null;
    return wrapped.getMap() as unknown as MapLibreMap;
  }, []);

  const handleClick = useCallback(
    (event: {
      lngLat: { lng: number; lat: number };
      features?: Array<{ properties?: Record<string, unknown> | null }>;
    }) => {
      // Topmost feature wins, except that among overlapping source pins a hub beats a catalog dot: the dots sit
      // close to the hubs and the hit areas overlap.
      const feats = event.features || [];
      const top = feats[0];
      const topKind = top?.properties?.kind;
      const pick =
        top && (topKind === 'hub' || topKind === 'archive')
          ? feats.find((f) => f.properties?.kind === 'hub') ?? top
          : top;
      const props = pick?.properties as
        | { id?: string; kind?: string; label?: string; host?: string }
        | undefined;
      if (props?.id) {
        if (variant === 'mini') return;
        if (props.kind === 'hub') {
          const hub = GLOBE_HUBS.find((h) => `hub:${h.name}` === props.id);
          if (hub) onHubSelect?.(hub);
          return;
        }
        const hit = sourcePoints.find((p) => p.id === props.id);
        onPlaceSelect?.({
          lat: hit?.lat ?? event.lngLat.lat,
          lon: hit?.lon ?? event.lngLat.lng,
          name: hit?.label || (typeof props.label === 'string' ? props.label : undefined),
          event: hit?.kind === 'event' ? hit : undefined,
        });
        return;
      }
      if (variant === 'mini') return;
      onPlaceSelect?.({ lat: event.lngLat.lat, lon: event.lngLat.lng });
    },
    [onHubSelect, onPlaceSelect, sourcePoints, variant],
  );

  // True from the moment a fly-to starts until it lands, so the idle drift never stops or overrides it.
  const flyActiveRef = useRef(false);

  useAutoRotate({ getMap, enabled: autoRotate && !paused && !inFlight && variant === 'full', flyActive: flyActiveRef });

  const runFlyTo = useCallback(
    (opts: { lat: number; lon: number; zoom?: number }) => {
      const map = getMap();
      if (!map) return Promise.resolve();
      const gen = ++flyGenRef.current;
      flyActiveRef.current = true; // before stop(): its moveend must not restart the idle drift
      try {
        map.stop();
      } catch {
        /* ignore */
      }
      return new Promise<void>((resolve) => {
        let settled = false;
        const finish = () => {
          if (settled || gen !== flyGenRef.current) return;
          settled = true;
          flyActiveRef.current = false;
          map.off('moveend', finish);
          resolve();
        };
        map.flyTo({
          center: [opts.lon, opts.lat],
          zoom: opts.zoom ?? Math.max(map.getZoom(), variant === 'mini' ? 2.6 : 5.2),
          speed: 0.95,
          curve: 1.62,
          easing: flyEasing || flyEase,
          essential: true,
        });
        // Listen only after the flight has started: flyTo stops whatever was moving, and that moveend must not count.
        map.once('moveend', finish);
        if (!map.isMoving()) finish();
        window.setTimeout(finish, 7000);
      });
    },
    [flyEasing, getMap, variant],
  );

  useImperativeHandle(
    ref,
    () => ({
      flyTo: runFlyTo,
      resize: () => {
        if (pausedRef.current || freezeResize) return;
        getMap()?.resize();
      },
      getView: () => {
        const map = getMap();
        if (!map) {
          return initialCamera || { lat: 18, lng: 20, zoom: 1.35 };
        }
        const c = map.getCenter();
        return { lat: c.lat, lng: c.lng, zoom: map.getZoom() };
      },
      pause: () => {
        const map = getMap();
        if (map) pauseMapLoop(map);
      },
      resume: () => {
        const map = getMap();
        if (map) resumeMapLoop(map);
      },
    }),
    [freezeResize, getMap, initialCamera, runFlyTo],
  );

  useEffect(() => {
    const map = getMap();
    if (!map) return;
    if (paused) pauseMapLoop(map);
    else resumeMapLoop(map);
  }, [getMap, paused]);

  useEffect(() => {
    const map = getMap();
    if (!map || paused) return;
    const ratio = variant === 'mini' ? miniPixelRatio() : fullPixelRatio();
    try {
      map.setPixelRatio(ratio);
    } catch {
      /* older builds */
    }
    if (!freezeResize) map.resize();
  }, [freezeResize, getMap, paused, variant]);

  useEffect(() => {
    if (!flyTo) return;
    void runFlyTo(flyTo);
  }, [flyTo, runFlyTo]);

  useEffect(() => {
    if (!idleDrift || inFlight || paused || variant !== 'mini') return;
    const map = getMap();
    if (!map) return;
    let stopped = false;
    const spin = () => {
      if (stopped || flyActiveRef.current) return;
      const mapNow = getMap();
      if (!mapNow || mapNow.isMoving()) return;
      const c = mapNow.getCenter();
      mapNow.easeTo({
        center: [c.lng + 1.05, c.lat],
        duration: 9000,
        easing: (t) => t,
        essential: false,
      });
    };
    const onEnd = () => {
      if (!stopped) spin();
    };
    map.on('moveend', onEnd);
    spin();
    return () => {
      stopped = true;
      map.off('moveend', onEnd);
      if (flyActiveRef.current) return; // a fly-to has taken over; stopping now would cut it short
      try {
        (map as MapLibreMap & { stop: () => void }).stop();
      } catch {
        /* ignore */
      }
    };
  }, [getMap, idleDrift, inFlight, paused, variant]);

  const atmosphere = useMemo(
    () => globeAtmosphere({ variant, appTheme }),
    [appTheme, variant],
  );

  const applyAtmosphere = useCallback(
    (map: MapLibreMap) => {
      const globeMap = map as MapLibreMap & {
        setProjection?: (p: { type: string }) => void;
        setFog?: (fog: Record<string, unknown> | null) => void;
        setLight?: (light: Record<string, unknown>) => void;
      };
      try {
        globeMap.setProjection?.({ type: mapProjection === 'mercator' ? 'mercator' : 'globe' });
      } catch {
        /* older builds */
      }
      try {
        if (mapProjection === 'mercator') globeMap.setFog?.(null);
        else globeMap.setFog?.(atmosphere.fog);
      } catch {
        /* fog optional */
      }
      try {
        globeMap.setLight?.(atmosphere.light);
      } catch {
        /* light optional */
      }
    },
    [atmosphere, mapProjection],
  );

  useEffect(() => {
    const map = getMap();
    if (!map) return;
    applyAtmosphere(map);
  }, [applyAtmosphere, getMap, mapProjection]);

  // Cull far-side HTML markers so Sydney isn't clickable while facing Mexico
  useEffect(() => {
    const map = mapInstance || getMap();
    if (!map) return;

    // Far-side visibility does not need frame-perfect updates: at most ~8 per second while moving, plus a final
    // exact one when the movement ends.
    let lastRun = 0;
    let pending: number | null = null;
    const throttled = () => {
      const now = performance.now();
      if (now - lastRun >= FACING_MIN_INTERVAL_MS) {
        updateFacing();
        return;
      }
      if (pending == null) {
        pending = window.setTimeout(() => {
          pending = null;
          updateFacing();
        }, FACING_MIN_INTERVAL_MS - (now - lastRun));
      }
    };
    const onMoveEnd = () => {
      if (pending != null) {
        window.clearTimeout(pending);
        pending = null;
      }
      updateFacing();
    };

    const updateFacing = () => {
      lastRun = performance.now();
      const publish = (next: Set<string> | null) => {
        // Only a point crossing the horizon changes this; skip the re-render of every marker otherwise.
        if (sameKeySet(frontKeysRef.current, next)) return;
        frontKeysRef.current = next;
        setFrontKeys(next);
      };
      if (mapProjection !== 'globe') {
        publish(null); // null = all visible (flat map)
        return;
      }
      const next = new Set<string>();
      // Hubs and catalog sources of the full globe live in a map layer, which the globe projection hides on the
      // far side by itself; only the remaining DOM markers need this culling.
      if (variant !== 'full') {
        for (const hub of GLOBE_HUBS) {
          if (isVisibleOnGlobe(map, hub.lat, hub.lon)) next.add(`hub:${hub.name}`);
        }
      }
      for (const p of sourcePoints) {
        if (variant === 'full' && isLayerKind(p.kind)) continue;
        if (isVisibleOnGlobe(map, p.lat, p.lon)) next.add(p.id);
      }
      for (const p of comparePlaces) {
        if (isVisibleOnGlobe(map, p.lat, p.lon)) next.add(`cmp:${p.lat},${p.lon}`);
      }
      if (selected && isVisibleOnGlobe(map, selected.lat, selected.lon)) {
        next.add(`sel:${selected.lat},${selected.lon}`);
      }
      publish(next);
    };

    updateFacing();
    map.on('move', throttled);
    map.on('moveend', onMoveEnd);
    return () => {
      if (pending != null) window.clearTimeout(pending);
      map.off('move', throttled);
      map.off('moveend', onMoveEnd);
    };
  }, [comparePlaces, getMap, mapInstance, mapProjection, selected, sourcePoints, variant]);

  const isFacing = useCallback(
    (key: string) => frontKeys == null || frontKeys.has(key),
    [frontKeys],
  );

  const pixelRatio = variant === 'mini' ? miniPixelRatio() : fullPixelRatio();

  // Hooks must run before any early return (config loads async).
  const pathGeoJson = useMemo((): GeoJSON.FeatureCollection => {
    const features: GeoJSON.Feature[] = [];
    for (const path of overlayPaths) {
      if (!path.coordinates.length) continue;
      // Split on antimeridian jumps so the ISS track doesn't smear across the map
      let ring: Array<[number, number]> = [];
      const flush = () => {
        if (ring.length < 2) {
          ring = [];
          return;
        }
        features.push({
          type: 'Feature',
          properties: { id: path.id, color: path.color || '#f43f5e' },
          geometry: { type: 'LineString', coordinates: ring },
        });
        ring = [];
      };
      for (const coord of path.coordinates) {
        if (ring.length && Math.abs(coord[0] - ring[ring.length - 1][0]) > 180) flush();
        ring.push(coord);
      }
      flush();
    }
    return { type: 'FeatureCollection', features };
  }, [overlayPaths]);

  const liveEventGeoJson = useMemo((): GeoJSON.FeatureCollection => {
    const features: GeoJSON.Feature[] = [];
    for (const p of sourcePoints) {
      if (p.kind !== 'event') continue;
      const host = p.host || 'event';
      features.push({
        type: 'Feature',
        properties: {
          id: p.id,
          kind: 'event',
          host,
          label: p.label,
          color: valueColor(host, p.meta as Record<string, unknown> | undefined) || LAYER_COLORS[host] || '#E4E4E2',
          track: Number.isFinite(Number(p.trackDeg)) ? Number(p.trackDeg) : 0,
        },
        geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
      });
    }
    return { type: 'FeatureCollection', features };
  }, [sourcePoints]);

  const liveEventLayer = useMemo(
    (): CircleLayerSpecification => ({
      id: 'globe-live-events',
      type: 'circle',
      source: 'globe-live-events',
      filter: ['!=', ['get', 'host'], 'flights'],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 3.5, 3, 5, 6, 7],
        'circle-color': ['get', 'color'],
        'circle-stroke-width': 1,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.92,
      },
    }),
    [],
  );

  const sourcePinGeoJson = useMemo(
    () => (variant === 'full' ? sourcePinFeatures(GLOBE_HUBS, sourcePoints) : null),
    [sourcePoints, variant],
  );
  const selectedPinId = useMemo(
    () => selectedSourceId(selected, _activeHub, sourcePoints),
    [selected, _activeHub, sourcePoints],
  );

  // Same look as the old DOM pins: hub coral, catalog tan, white ring. A transparent larger circle makes the tiny
  // catalog dots (5-7 px) easy to hit.
  const sourcePinLayer = useMemo(
    (): CircleLayerSpecification => ({
      id: 'globe-source-pins',
      type: 'circle',
      source: 'globe-source-pins',
      paint: {
        'circle-radius': ['get', 'r'],
        'circle-color': ['match', ['get', 'kind'], 'hub', '#E4E4E2', '#A7A7A7'],
        'circle-stroke-width': ['match', ['get', 'kind'], 'hub', 1.5, 1],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-opacity': 0.92,
      },
    }),
    [],
  );
  const sourceHitLayer = useMemo(
    (): CircleLayerSpecification => ({
      id: 'globe-source-hit',
      type: 'circle',
      source: 'globe-source-pins',
      paint: { 'circle-radius': 9, 'circle-color': '#141414', 'circle-opacity': 0 },
    }),
    [],
  );
  const sourceSelectedLayer = useMemo(
    (): CircleLayerSpecification => ({
      id: 'globe-source-selected',
      type: 'circle',
      source: 'globe-source-pins',
      filter: ['==', ['get', 'id'], selectedPinId ?? ''],
      paint: {
        'circle-radius': ['+', ['get', 'r'], 3.5],
        'circle-color': '#E4E4E2',
        'circle-opacity': 0.28,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#E4E4E2',
      },
    }),
    [selectedPinId],
  );

  const liveFlightLayer = useMemo(
    (): SymbolLayerSpecification => ({
      id: 'globe-live-flights',
      type: 'symbol',
      source: 'globe-live-events',
      filter: ['==', ['get', 'host'], 'flights'],
      layout: {
        'icon-image': 'globe-plane',
        'icon-size': 0.72,
        'icon-rotate': ['get', 'track'],
        'icon-rotation-alignment': 'map',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
    }),
    [],
  );

  const metricData = useMemo(() => metricGeoJson(sourcePoints), [sourcePoints]);
  const bars = useMemo(() => (dataView === 'bars' ? barRows(sourcePoints) : []), [dataView, sourcePoints]);

  const pathLineLayer = useMemo(
    (): LineLayerSpecification => ({
      id: 'globe-overlay-paths',
      type: 'line',
      source: 'globe-overlay-paths',
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#f43f5e',
        'line-width': 3.25,
        'line-opacity': 0.9,
      },
    }),
    [],
  );

  if (!config) {
    return (
      <div
        className={`absolute inset-0 flex items-center justify-center ${
          stage.canvasClass || 'bg-[var(--bg)]'
        } ${className}`}
      >
        <span
          className={`font-mono text-xs ${stage.research ? 'text-[#CECECE]' : 'text-[var(--text-muted)]'}`}
        >
          Preparing map…
        </span>
      </div>
    );
  }

  const usingLocationIq = config.provider === 'locationiq';
  const interactive = variant !== 'mini';
  const liveIds = new Set(sourcePoints.filter((p) => p.kind === 'live' || p.kind === 'place').map((p) => p.id));

  return (
    <div
      className={`globe-map-canvas absolute inset-0 h-full w-full ${stage.canvasClass} ${className}`}
    >
      <Map
        key={`map-${basemapTheme}-${usingLocationIq ? 'liq' : 'ofm'}`}
        ref={mapRef}
        onClick={handleClick}
        mapStyle={config.mapStyle}
        initialViewState={{
          longitude: initialCamera?.lng ?? 20,
          latitude: initialCamera?.lat ?? 18,
          zoom: initialCamera?.zoom ?? 1.35,
        }}
        attributionControl={hideChrome ? false : { compact: true }}
        interactive={interactive}
        interactiveLayerIds={variant === 'full' ? ['globe-live-events', 'globe-live-flights', 'globe-source-hit'] : undefined}
        dragPan={interactive}
        dragRotate={interactive}
        scrollZoom={interactive}
        doubleClickZoom={interactive}
        touchZoomRotate={interactive}
        keyboard={interactive}
        trackResize={!paused && !freezeResize}
        pixelRatio={pixelRatio}
        fadeDuration={variant === 'mini' ? 0 : currentTierSettings().fadeMs}
        maxTileCacheSize={variant === 'mini' ? 48 : currentTierSettings().tileCache}
        renderWorldCopies={variant === 'full'}
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
        cursor={interactive ? 'crosshair' : 'pointer'}
        onLoad={(evt) => {
          try {
            const map = evt.target as MapLibreMap;
            setMapInstance(map);
            applyAtmosphere(map);
            try {
              map.setPixelRatio(pixelRatio);
            } catch {
              /* ignore */
            }
            if (!freezeResize) map.resize();
            if (pausedRef.current) pauseMapLoop(map);
            try {
              ensurePlaneIcon(map);
            } catch {
              /* icon optional */
            }
            onMapReady?.();
            if (!engineReadyRef.current) {
              engineReadyRef.current = true;
              onEngineReady?.({
                flyTo: runFlyTo,
                resize: () => {
                  if (pausedRef.current) return;
                  map.resize();
                },
                getView: () => {
                  const c = map.getCenter();
                  return { lat: c.lat, lng: c.lng, zoom: map.getZoom() };
                },
                pause: () => pauseMapLoop(map),
                resume: () => resumeMapLoop(map),
              });
            }
          } catch (err) {
            onMapError?.(err instanceof Error ? err.message : 'Could not enable globe projection');
          }
        }}
        onError={(evt) => {
          const msg = String(
            (evt as { error?: { message?: string } }).error?.message || 'Map failed to load',
          );
          onMapError?.(msg);
        }}
      >
        {overlayRasters.map((r) =>
          r.image ? (
            <Source key={r.id} id={`globe-raster-${r.id}`} type="image" url={r.image.url} coordinates={r.image.coordinates as [[number, number], [number, number], [number, number], [number, number]]}>
              <Layer id={`globe-raster-layer-${r.id}`} type="raster" paint={{ 'raster-opacity': r.opacity ?? 0.85, 'raster-fade-duration': 0, 'raster-resampling': 'linear' }} />
            </Source>
          ) : (
            <Source key={r.id} id={`globe-raster-${r.id}`} type="raster" tiles={r.tiles ?? []} tileSize={r.tileSize ?? 256} maxzoom={r.maxzoom ?? 7} attribution={r.attribution}>
              <Layer id={`globe-raster-layer-${r.id}`} type="raster" paint={{ 'raster-opacity': r.opacity ?? 0.7, 'raster-fade-duration': 0 }} />
            </Source>
          ),
        )}

        {overlayPaths.length > 0 ? (
          <Source id="globe-overlay-paths" type="geojson" data={pathGeoJson}>
            <Layer {...pathLineLayer} />
          </Source>
        ) : null}

        {sourcePinGeoJson && sourcePinGeoJson.features.length > 0 ? (
          <Source id="globe-source-pins" type="geojson" data={sourcePinGeoJson}>
            <Layer {...sourceHitLayer} />
            <Layer {...sourcePinLayer} />
            <Layer {...sourceSelectedLayer} />
          </Source>
        ) : null}

        {variant === 'full' && dataView === 'pins' && liveEventGeoJson.features.length > 0 ? (
          <Source id="globe-live-events" type="geojson" data={liveEventGeoJson}>
            <Layer {...liveEventLayer} />
            <Layer {...liveFlightLayer} />
          </Source>
        ) : null}

        {dataView === 'heat' || dataView === 'density' ? (
          <Source id="globe-metric" type="geojson" data={metricData}>
            {dataView === 'heat' ? <Layer {...HEAT_LAYER} /> : <Layer {...DENSITY_LAYER} />}
          </Source>
        ) : null}

        {/* Hub pins: see the 'globe-source-pins' map layer above (full variant). */}

        {dataView === 'bars' ? (
          <BarMarkers
            rows={bars}
            isFacing={isFacing}
            selectable={variant !== 'mini'}
            onSelect={(point) => onPlaceSelect?.({ lat: point.lat, lon: point.lon, name: point.label, event: point })}
          />
        ) : null}

        {sourcePoints
          .filter(
            (p) =>
              p.kind !== 'hub' &&
              !(variant === 'full' && isLayerKind(p.kind)) &&
              (dataView === 'pins' || p.kind !== 'event') &&
              !(variant === 'full' && dataView === 'pins' && p.kind === 'event'),
          )
          .map((point) => {
            const facing = isFacing(point.id);
            return (
              <Marker
                key={point.id}
                longitude={point.lon}
                latitude={point.lat}
                anchor={point.kind === 'event' ? 'bottom' : 'center'}
                style={{
                  pointerEvents: facing ? 'auto' : 'none',
                  opacity: facing ? 1 : 0,
                }}
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  if (variant === 'mini' || !facing) return;
                  onPlaceSelect?.({
                    lat: point.lat,
                    lon: point.lon,
                    name: point.label,
                    event: point.kind === 'event' ? point : undefined,
                  });
                }}
              >
                <SourcePin
                  point={point}
                  selected={
                    selected?.lat === point.lat &&
                    selected?.lon === point.lon &&
                    (!selected?.name || selected.name === point.label)
                  }
                />
              </Marker>
            );
          })}

        {comparePlaces.map((p, i) => {
          const key = `cmp:${p.lat},${p.lon}`;
          const facing = isFacing(key);
          return (
            <Marker
              key={`cmp-${p.lat}-${p.lon}-${i}`}
              longitude={p.lon}
              latitude={p.lat}
              anchor="center"
              style={{
                pointerEvents: 'none',
                opacity: facing ? 1 : 0,
              }}
            >
              <span className="globe-pin globe-pin--compare" title={p.name} />
            </Marker>
          );
        })}

        {selected && !liveIds.has(`place:${selected.lat.toFixed(3)}:${selected.lon.toFixed(3)}`) ? (
          <Marker
            longitude={selected.lon}
            latitude={selected.lat}
            anchor="bottom"
            style={{
              pointerEvents: 'none',
              opacity: isFacing(`sel:${selected.lat},${selected.lon}`) ? 1 : 0,
            }}
          >
            <span className="globe-selection-pin" title={selected.name || 'Selected'} />
          </Marker>
        ) : null}
      </Map>

      <OrbitSvgOverlay map={mapInstance} paths={overlayPaths} mapProjection={mapProjection} />

      {mapProjection === 'globe' ? (
        <>
          <div className="globe-atmosphere-rim" />
          <div className="globe-sphere-shade" />
        </>
      ) : null}

      {!usingLocationIq && !hideChrome && process.env.NODE_ENV !== 'production' ? (
        <div className="pointer-events-none absolute left-1/2 top-16 z-10 max-w-sm -translate-x-1/2 rounded-xl border border-amber-500/30 bg-amber-50/95 px-3 py-2 text-center text-[11px] text-amber-900 shadow-lg backdrop-blur dark:border-amber-400/20 dark:bg-amber-950/90 dark:text-amber-100">
          Set server-only <code className="font-mono">LOCATIONIQ_KEY</code> (not{' '}
          <code className="font-mono">NEXT_PUBLIC_*</code>) on Vercel. Showing OpenFreeMap fallback.
        </div>
      ) : null}

    </div>
  );
});

PlaceMapLibre.displayName = 'PlaceMapLibre';
