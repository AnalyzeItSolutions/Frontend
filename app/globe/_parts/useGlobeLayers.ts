'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getProjects } from '../../lib/chatApi';
import { pickScopedProject } from '../../lib/projectHome.mjs';
import { fetchGlobeEvents, fetchProjectGlobePoints } from '../../lib/geoApi';
import { LIVE_LAYER_POLL_MS } from '../../Components/globe/globePerf';
import { interpretLayerPayload, mergeLayerRefresh } from '../../Components/globe/dataQuality.mjs';
import { buildLiveOverlays } from '../../Components/globe/liveOverlays.mjs';
import { useGlobe } from '../../Components/globe/useGlobe';
import type { OverlayPath, SourcePoint } from '../../Components/globe/types';
import { DEFAULT_LAYERS, LAYERS, LIVE_LAYER_IDS, type LayerHealth, type LayerId } from './layers';

type Events = Array<Record<string, unknown>>;
type CacheEntry = {
  events: Events;
  path: Array<{ lat?: number; lon?: number }> | null;
  lines: Events | null;
  health: LayerHealth;
  fetchedAt: number;
};

const EMPTY: Events = [];

/**
 * Which layers are on, and the live data behind them.
 *
 * Each layer has its own cache entry, so switching one on fetches only that layer, switching one off just
 * redraws, and a layer that arrives early is drawn without waiting for a slow one.
 */
export function useGlobeLayers(days: number, requestedProject: string) {
  const { setOverlayPaths, setShowCatalog, getView } = useGlobe();
  const [layers, setLayers] = useState<Record<LayerId, boolean>>(DEFAULT_LAYERS);
  const [layerCounts, setLayerCounts] = useState<Partial<Record<LayerId, number>>>({});
  const [layerHealth, setLayerHealth] = useState<Partial<Record<LayerId, LayerHealth>>>({});
  const [rawPoints, setRawPoints] = useState<SourcePoint[]>([]);
  const [fieldEvents, setFieldEvents] = useState<{ weather: Events; air_quality: Events }>({ weather: EMPTY, air_quality: EMPTY });
  const [inflight, setInflight] = useState(0);
  const [projectId, setProjectId] = useState('');
  /** Bumped while the server is still geocoding place names, so My data fills in without waiting for the poll. */
  const [myDataTick, setMyDataTick] = useState(0);

  const cache = useRef<Partial<Record<LayerId, CacheEntry>>>({});
  /** Where the view was when flights were last asked for (their fallback covers 250 nm around it). */
  const flightsAt = useRef<{ lat: number; lon: number } | null>(null);
  const flightsNearOnly = useRef(false);
  /** Lines drawn with the layers but not from them (the area being drawn). */
  const extraPaths = useRef<OverlayPath[]>([]);
  const epoch = useRef(0);
  const abort = useRef<AbortController | null>(null);
  const myDataTimer = useRef<number | null>(null);
  const layersRef = useRef(layers);
  layersRef.current = layers;

  const toggleLayer = useCallback(
    (id: LayerId) => setLayers((prev) => ({ ...prev, [id]: !prev[id] })),
    [],
  );

  useEffect(() => setShowCatalog(Boolean(layers.catalog)), [layers.catalog, setShowCatalog]);
  useEffect(() => () => {
    if (myDataTimer.current) window.clearTimeout(myDataTimer.current);
  }, []);

  // "My data" needs the person's project; find it the first time the layer is switched on.
  useEffect(() => {
    if (!layers.my_data || projectId) return;
    let cancelled = false;
    getProjects()
      .then((rows) => {
        if (cancelled) return;
        const picked = pickScopedProject(rows, requestedProject);
        if (picked.status !== 'missing' && picked.projectId) setProjectId(picked.projectId);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [layers.my_data, projectId, requestedProject]);

  /** Draw whatever is cached for the layers that are on right now. */
  const rebuild = useCallback(() => {
    const on = layersRef.current;
    const merged: Record<string, { events?: Events; path?: Array<{ lat?: number; lon?: number }>; lines?: Events }> = {};
    const health: Partial<Record<LayerId, LayerHealth>> = {};
    for (const id of LIVE_LAYER_IDS) {
      const entry = cache.current[id];
      if (!on[id] || !entry) continue;
      merged[id] = { events: entry.events, ...(entry.path ? { path: entry.path } : {}), ...(entry.lines ? { lines: entry.lines } : {}) };
      health[id] = entry.health;
    }
    const { points, paths, counts } = buildLiveOverlays(on, merged);
    setLayerCounts(counts);
    setLayerHealth(health);
    setRawPoints(points as SourcePoint[]);
    setOverlayPaths([...paths, ...extraPaths.current]);
    setFieldEvents((prev) => {
      const weather = on.weather ? cache.current.weather?.events ?? EMPTY : EMPTY;
      const air = on.air_quality ? cache.current.air_quality?.events ?? EMPTY : EMPTY;
      return prev.weather === weather && prev.air_quality === air ? prev : { weather, air_quality: air };
    });
  }, [setOverlayPaths]);

  const fetchOne = useCallback(
    async (id: LayerId, signal: AbortSignal): Promise<Record<string, unknown> | null> => {
      if (id === 'my_data') {
        if (!projectId) return { fetchError: 'Opening your project…' };
        try {
          const mine = await fetchProjectGlobePoints(projectId, signal);
          if (mine.pending > 0 && !signal.aborted) {
            if (myDataTimer.current) window.clearTimeout(myDataTimer.current);
            myDataTimer.current = window.setTimeout(() => {
              delete cache.current.my_data;
              setMyDataTick((n) => n + 1);
            }, 4000);
          }
          const noLocation = mine.objects.length > 0 && mine.objects.every((o) => o.mode === null);
          return noLocation
            ? { error: 'None of your objects has a location field (latitude/longitude, city or country).' }
            : { events: mine.points };
        } catch (err) {
          if (signal.aborted) return null;
          return { fetchError: err instanceof Error ? err.message : 'Could not load your data' };
        }
      }
      try {
        const view = id === 'flights' ? getView() : null;
        if (view) flightsAt.current = { lat: view.lat, lon: view.lng };
        const data = await fetchGlobeEvents({ layers: [id], minMagnitude: 2.5, days, near: view ? { lat: view.lat, lon: view.lng } : null, signal });
        const bucket = (data.layers || {}) as Record<string, Record<string, unknown>>;
        return bucket[id] || { events: [] };
      } catch (err) {
        if (signal.aborted) return null;
        return { fetchError: err instanceof Error ? err.message : 'Could not load layer' };
      }
    },
    [days, projectId, getView],
  );

  /** Fetch the given layers in parallel; each one is drawn as soon as it lands. */
  const refresh = useCallback(
    async (ids: LayerId[], signal: AbortSignal, myEpoch: number) => {
      if (!ids.length) return;
      setInflight((n) => n + ids.length);
      await Promise.all(
        ids.map(async (id) => {
          try {
            const payload = await fetchOne(id, signal);
            if (payload === null || signal.aborted || myEpoch !== epoch.current) return;
            const next = mergeLayerRefresh(cache.current[id], interpretLayerPayload(payload));
            if (id === 'flights') flightsNearOnly.current = payload.near_only === true;
            if (next.status === 'loading') {
              // The server is still downloading this layer for the first time: ask again shortly.
              window.setTimeout(() => {
                if (layersRef.current[id] && !signal.aborted) void refresh([id], signal, myEpoch);
              }, 20_000);
            }
            cache.current[id] = {
              events: next.events,
              path: next.path,
              lines: next.lines,
              health: { status: next.status, message: next.message, truncated: payload.truncated === true },
              fetchedAt: Date.now(),
            };
            rebuild();
          } finally {
            setInflight((n) => n - 1);
          }
        }),
      );
    },
    [fetchOne, rebuild],
  );

  // A new window or project starts from scratch.
  useEffect(() => {
    epoch.current += 1;
    abort.current?.abort();
    abort.current = new AbortController();
    cache.current = {};
    setInflight(0);
    return () => abort.current?.abort();
  }, [days, projectId]);

  // Layers switched on/off: draw from cache at once, fetch only what is missing or stale.
  const enabledKey = LIVE_LAYER_IDS.filter((id) => layers[id]).join(',');
  useEffect(() => {
    rebuild();
    const signal = abort.current?.signal;
    if (!signal) return;
    const now = Date.now();
    const need = LIVE_LAYER_IDS.filter((id) => {
      if (!layers[id]) return false;
      const entry = cache.current[id];
      return !entry || now - entry.fetchedAt > LIVE_LAYER_POLL_MS;
    });
    void refresh(need, signal, epoch.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledKey, days, projectId, myDataTick, refresh, rebuild]);

  // Keep what is on fresh. Never in an animation frame.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const signal = abort.current?.signal;
      if (!signal || document.hidden) return;
      void refresh(LIVE_LAYER_IDS.filter((id) => layersRef.current[id]), signal, epoch.current);
    }, LIVE_LAYER_POLL_MS);
    return () => window.clearInterval(timer);
  }, [refresh]);

  // Flights from the "around your view" fallback follow the view: moved far enough, ask again for the new place.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const signal = abort.current?.signal;
      const was = flightsAt.current;
      const view = getView();
      if (!signal || !layersRef.current.flights || !flightsNearOnly.current || !was || !view || document.hidden) return;
      const dLat = Math.abs(view.lat - was.lat);
      const dLon = Math.abs(((view.lng - was.lon + 540) % 360) - 180);
      if (dLat > 3 || dLon > 3 / Math.max(Math.cos((view.lat * Math.PI) / 180), 0.2)) void refresh(['flights'], signal, epoch.current);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [getView, refresh]);

  // Radar / clouds / catalog change nothing about the data, only the redraw.
  useEffect(() => {
    rebuild();
  }, [layers, rebuild]);

  const setExtraPaths = useCallback(
    (paths: OverlayPath[]) => {
      extraPaths.current = paths;
      rebuild();
    },
    [rebuild],
  );

  const anyLayerOn = useMemo(() => Object.values(layers).some(Boolean), [layers]);
  const cappedLayers = useMemo(
    () => LAYERS.filter((l) => layerHealth[l.id]?.truncated).map((l) => l.label),
    [layerHealth],
  );

  return {
    layers,
    setLayers,
    toggleLayer,
    layerCounts,
    layerHealth,
    layersLoading: inflight > 0,
    rawPoints,
    fieldEvents,
    projectId,
    anyLayerOn,
    cappedLayers,
    setExtraPaths,
  };
}
