'use client';

import { useCallback, useRef, useState, type MutableRefObject } from 'react';
import { calloutFor, resolveChatIngest } from './resolveSources';
import type { ChatRunIngest, GlobeCamera, GlobeMapHandle, GlobeVariant, QueuedFly, SourcePoint } from './types';
import { DEFAULT_CAMERA } from './types';
import { MAX_FLY_QUEUE } from './globePerf';

function sleep(ms: number, gen: number, genRef: { current: number }) {
  return new Promise<void>((resolve) => {
    window.setTimeout(() => {
      if (gen === genRef.current) resolve();
      else resolve();
    }, ms);
  });
}

/**
 * Everything about moving the camera and what a chat run puts on the map: single flights, the chained
 * sequence for a run's places, the queue of flights waiting while the full globe is open, and which
 * place the run located first (so a publisher's HQ never overtakes the place the question named).
 */
export function useFlyController({
  engineRef,
  variantRef,
}: {
  engineRef: MutableRefObject<GlobeMapHandle | null>;
  variantRef: MutableRefObject<GlobeVariant>;
}) {
  const [camera, setCamera] = useState<GlobeCamera>(DEFAULT_CAMERA);
  const [activePoints, setActivePoints] = useState<SourcePoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<SourcePoint | null>(null);
  const [inFlight, setInFlight] = useState(false);
  const [pendingFlyTarget, setPendingFlyTarget] = useState<SourcePoint | null>(null);
  const [flyCallout, setFlyCallout] = useState<string | null>(null);
  const [queuedFlights, setQueuedFlights] = useState<QueuedFly[]>([]);
  const [activeHub, setActiveHub] = useState<string | null>(null);
  const flyGenRef = useRef(0);
  const sequenceRef = useRef<SourcePoint[]>([]);
  const sequenceRunningRef = useRef(false);

  const queueIfFull = useCallback((points: SourcePoint[]) => {
    setQueuedFlights((prev) => {
      const seen = new Set(prev.map((q) => q.point.id));
      const add = points.filter((p) => !seen.has(p.id));
      if (!add.length) return prev;
      const next = [
        ...prev,
        ...add.map((point) => ({
          id: `q-${point.id}-${Date.now()}`,
          point,
        })),
      ];
      return next.slice(-MAX_FLY_QUEUE);
    });
  }, []);

  const runFly = useCallback(
    async (point: SourcePoint, opts?: { zoom?: number; user?: boolean }, gen?: number) => {
      const myGen = gen ?? ++flyGenRef.current;
      if (variantRef.current === 'full' && !opts?.user) {
        queueIfFull([point]);
        return;
      }
      setSelectedPoint(point);
      setPendingFlyTarget(point);
      setFlyCallout(calloutFor(point));
      setInFlight(true);
      setActivePoints((prev) => {
        if (prev.some((p) => p.id === point.id)) {
          return prev.map((p) => (p.id === point.id ? { ...p, pulse: true } : p));
        }
        return [...prev, { ...point, pulse: true }];
      });

      let engine = engineRef.current;
      if (!engine) {
        for (let i = 0; i < 40 && myGen === flyGenRef.current; i += 1) {
          await new Promise((r) => window.setTimeout(r, 100));
          engine = engineRef.current;
          if (engine) break;
        }
      }
      if (myGen !== flyGenRef.current) return;
      const zoom =
        opts?.zoom ??
        (variantRef.current === 'mini' ? (point.kind === 'place' ? 2.6 : 2.2) : 5.6);
      if (engine) {
        await engine.flyTo({ lat: point.lat, lon: point.lon, zoom });
      }
      if (myGen !== flyGenRef.current) return;
      setCamera({ lat: point.lat, lng: point.lon, zoom });
      setInFlight(false);
      setPendingFlyTarget(null);
    },
    [queueIfFull],
  );

  const drainSequence = useCallback(async () => {
    if (sequenceRunningRef.current) return;
    sequenceRunningRef.current = true;
    try {
      while (sequenceRef.current.length) {
        const gen = flyGenRef.current;
        if (variantRef.current === 'full') {
          queueIfFull(sequenceRef.current.splice(0));
          break;
        }
        const next = sequenceRef.current.shift();
        if (!next) break;
        await runFly(next, undefined, gen);
        if (gen !== flyGenRef.current) continue;
        await sleep(450, gen, flyGenRef);
      }
    } finally {
      sequenceRunningRef.current = false;
      if (!sequenceRef.current.length) setFlyCallout(null);
      else if (variantRef.current === 'mini') void drainSequence();
    }
  }, [queueIfFull, runFly]);

  const flyTo = useCallback(
    async (point: SourcePoint, opts?: { zoom?: number; user?: boolean }) => {
      flyGenRef.current += 1;
      sequenceRef.current = [];
      await runFly(point, opts, flyGenRef.current);
      setFlyCallout(null);
    },
    [runFly],
  );

  const flyToLatLon = useCallback(
    (
      lat: number,
      lon: number,
      opts?: { zoom?: number; name?: string; country?: string; hub?: string | null; user?: boolean },
    ) => {
      const point: SourcePoint = {
        id: `place:${lat.toFixed(3)}:${lon.toFixed(3)}`,
        lat,
        lon,
        label: opts?.name || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
        kind: 'place',
        pulse: false,
      };
      setActiveHub(opts?.hub ?? null);
      void flyTo(point, { zoom: opts?.zoom, user: opts?.user ?? true });
    },
    [flyTo],
  );

  const selectPoint = useCallback((point: SourcePoint | null) => {
    setSelectedPoint(point);
    if (!point) setActiveHub(null);
  }, []);

  // What this chat run has located so far. A source's publisher HQ (usgs.gov -> Virginia) is only a fallback for a
  // run that never found a real place, and must never overtake the place the question itself named.
  const runPlaceRef = useRef(false);
  const runPendingRef = useRef<Promise<unknown>>(Promise.resolve());
  const runGenRef = useRef(0);

  const beginChatRun = useCallback(() => {
    runGenRef.current += 1;
    runPlaceRef.current = false;
    runPendingRef.current = Promise.resolve();
    flyGenRef.current += 1;
    sequenceRef.current = [];
    setActivePoints([]);
    setFlyCallout(null);
    setPendingFlyTarget(null);
    setInFlight(false);
  }, []);

  const ingestChatRun = useCallback(
    (input: ChatRunIngest) => {
      const gen = runGenRef.current;
      const task = (async () => {
        // Sources wait for any place lookup already under way, so the place is always flown to first.
        if (!input.query && !input.places?.length && !input.city) await runPendingRef.current;
        const points = await resolveChatIngest(input, { hasPlaceAlready: runPlaceRef.current });
        if (gen !== runGenRef.current) return; // a newer chat run began while this was resolving
        if (points.some((p) => p.kind === 'place')) runPlaceRef.current = true;
        if (!points.length) return;
        setActivePoints((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          const add = points.filter((p) => !seen.has(p.id));
          return add.length ? [...prev, ...add] : prev;
        });
        if (variantRef.current === 'full') {
          queueIfFull(points);
          return;
        }
        if (variantRef.current !== 'mini') return;
        const known = new Set(sequenceRef.current.map((p) => p.id));
        for (const point of points) {
          if (sequenceRef.current.length >= MAX_FLY_QUEUE) break;
          if (!known.has(point.id)) {
            known.add(point.id);
            sequenceRef.current.push(point);
          }
        }
        void drainSequence();
      })();
      if (input.query || input.places?.length || input.city) runPendingRef.current = task;
    },
    [drainSequence, queueIfFull],
  );

  const consumeQueuedFly = useCallback(
    (id: string) => {
      setQueuedFlights((prev) => {
        const item = prev.find((q) => q.id === id);
        if (item) void flyTo(item.point, { user: true, zoom: 5.8 });
        return prev.filter((q) => q.id !== id);
      });
    },
    [flyTo],
  );

  const dismissQueuedFly = useCallback((id: string) => {
    setQueuedFlights((prev) => prev.filter((q) => q.id !== id));
  }, []);

  /** The full globe opened: flights still waiting in the run's sequence move to its queue. */
  const flushSequenceToQueue = useCallback(() => {
    const remaining = sequenceRef.current.splice(0);
    if (remaining.length) queueIfFull(remaining);
  }, [queueIfFull]);

  return {
    camera,
    activePoints,
    selectedPoint,
    setSelectedPoint,
    inFlight,
    pendingFlyTarget,
    flyCallout,
    queuedFlights,
    activeHub,
    setActiveHub,
    flyTo,
    flyToLatLon,
    selectPoint,
    beginChatRun,
    ingestChatRun,
    consumeQueuedFly,
    dismissQueuedFly,
    flushSequenceToQueue,
  };
}
