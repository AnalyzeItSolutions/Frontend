'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { selectDisplayPoints } from './dataQuality.mjs';
import { MINI_PIN_CAP } from './globePerf';
import { catalogArchivePoints, fetchRegistryPoints } from './sourceCatalog';
import type {
  GlobeDataView,
  GlobeMapHandle,
  GlobeVariant,
  MapProjectionMode,
  OverlayPath,
  RasterOverlay,
  SourcePoint,
} from './types';
import { currentTierSettings, isGlobePath } from './globePerf';
import { GlobeContext, type GlobeContextValue, type MountRect } from './globeContext';
import { FLIP_MS, useGlobeMounts } from './useGlobeMounts';
import { useFlyController } from './useFlyController';

export { useGlobe, useGlobeOptional } from './globeContext';
export type { GlobeContextValue } from './globeContext';

const PlaceMapLibre = dynamic(
  () => import('../map/PlaceMapLibre').then((m) => m.PlaceMapLibre),
  { ssr: false },
);

/**
 * Owns the one shared map and the state around it. The moving parts live in hooks:
 * useFlyController (camera, chat-run flights), useGlobeMounts (where the map is shown and the flip animation).
 */
export function GlobeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const engineRef = useRef<GlobeMapHandle | null>(null);
  const variantRef = useRef<GlobeVariant>('parked');
  const fly = useFlyController({ engineRef, variantRef });
  const mounts = useGlobeMounts({ engineRef, variantRef, flushSequenceToQueue: fly.flushSequenceToQueue });
  const { variant, mapReady, transitioning, holdMap, portalReady, stageRect, engineArmed, docHidden, slotEl } = mounts;
  const { registerMount, expandToFull, handleEngineReady, parkingRef, flipRef } = mounts;
  const { camera, activePoints, selectedPoint, inFlight, pendingFlyTarget, flyCallout, queuedFlights, activeHub } = fly;
  const { setActiveHub, setSelectedPoint, flyTo, flyToLatLon, selectPoint, beginChatRun, ingestChatRun } = fly;
  const { consumeQueuedFly, dismissQueuedFly } = fly;

  const [archivePoints, setArchivePoints] = useState<SourcePoint[]>(() => catalogArchivePoints());

  const [comparePlaces, setComparePlaces] = useState<Array<{ lat: number; lon: number; name?: string }>>(
    [],
  );
  const [overlayPoints, setOverlayPoints] = useState<SourcePoint[]>([]);
  const [overlayPaths, setOverlayPaths] = useState<OverlayPath[]>([]);
  const [overlayRasters, setOverlayRasters] = useState<RasterOverlay[]>([]);
  const [showCatalog, setShowCatalog] = useState(true);
  const [mapProjection, setMapProjection] = useState<MapProjectionMode>('globe');
  const [dataView, setDataView] = useState<GlobeDataView>('pins');

  // Dead-reckon aircraft between live polls so planes appear to travel.
  useEffect(() => {
    if (docHidden) return;
    const id = window.setInterval(() => {
      setOverlayPoints((prev) => {
        let changed = false;
        const next = prev.map((p) => {
          if (p.host !== 'flights') return p;
          const vel = p.meta?.velocity_ms != null ? Number(p.meta.velocity_ms) : NaN;
          const track = p.trackDeg != null ? Number(p.trackDeg) : NaN;
          if (!Number.isFinite(vel) || vel < 15 || !Number.isFinite(track)) return p;
          const rad = (track * Math.PI) / 180;
          const R = 6371000;
          const dLat = ((vel * Math.cos(rad)) / R) * (180 / Math.PI);
          const cosLat = Math.cos((p.lat * Math.PI) / 180);
          const dLon =
            cosLat > 0.05 ? ((vel * Math.sin(rad)) / (R * cosLat)) * (180 / Math.PI) : 0;
          changed = true;
          let lon = p.lon + dLon;
          if (lon > 180) lon -= 360;
          if (lon < -180) lon += 360;
          return { ...p, lat: Math.max(-85, Math.min(85, p.lat + dLat)), lon };
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [docHidden]);

  const onMapPlaceSelectRef = useRef<((place: { lat: number; lon: number }) => void) | null>(null);
  const onGlobeClickRef = useRef<((lat: number, lng: number, label?: string) => void) | null>(null);

  useEffect(() => {
    // Catalog HQ pins from GET /v1/sources (near-static). Live weather/markets
    // are not loaded here — only the full Globe page hits POST /v1/geo/context.
    if (!engineArmed) return;
    let cancelled = false;
    void fetchRegistryPoints().then((points) => {
      if (!cancelled && points.length) setArchivePoints(points);
    });
    return () => {
      cancelled = true;
    };
  }, [engineArmed]);

  const setOnMapPlaceSelect = useCallback(
    (fn: ((place: { lat: number; lon: number }) => void) | null) => {
      onMapPlaceSelectRef.current = fn;
    },
    [],
  );

  /** Widget→Globe: fly the globe to a lat/lng from a metric widget. */
  const broadcastFocus = useCallback(
    (lat: number, lng: number, label?: string) => {
      flyToLatLon(lat, lng, { name: label, zoom: 5.5, user: true });
    },
    [flyToLatLon],
  );

  /** Globe→Widget: register a callback for when the user clicks a place on the globe. */
  const setOnGlobeClick = useCallback(
    (cb: ((lat: number, lng: number, label?: string) => void) | null) => {
      onGlobeClickRef.current = cb;
    },
    [],
  );

  const handleMapPlaceSelect = useCallback(
    (place: { lat: number; lon: number; name?: string; event?: SourcePoint }) => {
      setActiveHub(null);
      if (place.event) {
        setSelectedPoint(place.event);
        onMapPlaceSelectRef.current?.(place);
        return;
      }
      const point: SourcePoint = {
        id: `place:${place.lat.toFixed(3)}:${place.lon.toFixed(3)}`,
        lat: place.lat,
        lon: place.lon,
        label: place.name || `${place.lat.toFixed(2)}°, ${place.lon.toFixed(2)}°`,
        kind: 'place',
      };
      setSelectedPoint(point);
      onMapPlaceSelectRef.current?.(place);
    },
    [],
  );

  const handleHubSelect = useCallback(
    (hub: { name: string; lat: number; lon: number }) => {
      flyToLatLon(hub.lat, hub.lon, { name: hub.name, zoom: 5.5, hub: hub.name, user: true });
    },
    [flyToLatLon],
  );

  const showMap = Boolean(holdMap && slotEl);
  const parked = variant === 'parked' && !transitioning;
  const paused = parked || docHidden || (!transitioning && !isGlobePath(pathname));
  const displayRect: MountRect =
    stageRect ||
    (parked
      ? { top: -400, left: -400, width: 8, height: 8 }
      : { top: 0, left: 0, width: 1, height: 1 });
  // Full globe: catalog (when that layer is on) + this chat's pins + live overlays.
  // Mini globe on Research is this run only — HQ seats are not the answer.
  const displayPoints = useMemo(
    () =>
      selectDisplayPoints({
        variant,
        showCatalog,
        archivePoints,
        activePoints,
        overlayPoints,
        cap: MINI_PIN_CAP,
      }),
    [archivePoints, activePoints, overlayPoints, showCatalog, variant],
  );

  useEffect(() => {
    if (!mapReady) return;
    if (paused) engineRef.current?.pause();
    else engineRef.current?.resume();
  }, [paused, mapReady]);

  const value = useMemo<GlobeContextValue>(
    () => ({
      variant,
      camera,
      activePoints,
      archivePoints,
      selectedPoint,
      inFlight,
      pendingFlyTarget,
      flyCallout,
      queuedFlights,
      mapReady,
      transitioning,
      registerMount,
      flyTo,
      flyToLatLon,
      selectPoint,
      beginChatRun,
      ingestChatRun,
      expandToFull,
      consumeQueuedFly,
      dismissQueuedFly,
      setComparePlaces,
      comparePlaces,
      overlayPoints,
      setOverlayPoints,
      overlayPaths,
      setOverlayPaths,
      overlayRasters,
      setOverlayRasters,
      showCatalog,
      setShowCatalog,
      mapProjection,
      setMapProjection,
      dataView,
      setDataView,
      activeHub,
      setActiveHub,
      setOnMapPlaceSelect,
      broadcastFocus,
      setOnGlobeClick,
    }),
    [
      variant,
      camera,
      activePoints,
      archivePoints,
      selectedPoint,
      inFlight,
      pendingFlyTarget,
      flyCallout,
      queuedFlights,
      mapReady,
      transitioning,
      registerMount,
      flyTo,
      flyToLatLon,
      selectPoint,
      beginChatRun,
      ingestChatRun,
      expandToFull,
      consumeQueuedFly,
      dismissQueuedFly,
      comparePlaces,
      overlayPoints,
      overlayPaths,
      overlayRasters,
      showCatalog,
      mapProjection,
      dataView,
      activeHub,
      setOnMapPlaceSelect,
      broadcastFocus,
      setOnGlobeClick,
    ],
  );


  const onChat = pathname === '/research' || pathname?.startsWith('/research');

  return (
    <GlobeContext.Provider value={value}>
      {children}
      <div
        ref={parkingRef}
        className="pointer-events-none fixed -left-[999px] top-0 h-px w-px overflow-hidden opacity-0"
        aria-hidden
      />
      {portalReady && transitioning
        ? createPortal(
            <motion.div
              ref={flipRef}
              className="globe-stage overflow-hidden"
              initial={false}
              animate={{
                top: displayRect.top,
                left: displayRect.left,
                width: displayRect.width,
                height: displayRect.height,
                borderRadius: 0,
              }}
              transition={{ duration: FLIP_MS / 1000, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: 'fixed',
                zIndex: 80,
                pointerEvents: 'none',
              }}
              aria-hidden
            />,
            document.body,
          )
        : null}
      {portalReady && showMap && slotEl
        ? createPortal(
            <PlaceMapLibre
              variant={variant === 'full' ? 'full' : 'mini'}
              selected={
                selectedPoint
                  ? {
                      lat: selectedPoint.lat,
                      lon: selectedPoint.lon,
                      name: selectedPoint.label,
                    }
                  : null
              }
              activeHub={activeHub}
              comparePlaces={comparePlaces}
              sourcePoints={displayPoints}
              overlayPaths={overlayPaths}
              overlayRasters={overlayRasters}
              mapProjection={mapProjection}
              dataView={variant === 'full' ? dataView : 'pins'}
              hideNavControl
              hideChrome={variant !== 'full'}
              idleDrift={variant === 'mini' && !inFlight && activePoints.length === 0 && onChat && !paused && currentTierSettings().idleDrift}
              inFlight={inFlight}
              paused={paused}
              freezeResize={transitioning}
              onHubSelect={handleHubSelect}
              onPlaceSelect={handleMapPlaceSelect}
              onEngineReady={handleEngineReady}
              initialCamera={camera}
            />,
            slotEl,
          )
        : null}
    </GlobeContext.Provider>
  );
}