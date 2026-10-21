'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { decodeScene, encodeScene } from '../../Components/globe/scene.mjs';
import { useGlobe } from '../../Components/globe/useGlobe';
import { type ComparePlace, type LayerId, type Selected } from './layers';

/** Restores a shared view from the URL (?layers=&days=&view=&proj=&places=&at=) and builds the share link. */
export function useGlobeScene({
  layers,
  setLayers,
  days,
  setDays,
  selected,
  compare,
}: {
  layers: Record<LayerId, boolean>;
  setLayers: React.Dispatch<React.SetStateAction<Record<LayerId, boolean>>>;
  days: number;
  setDays: (d: number) => void;
  selected: Selected | null;
  compare: ComparePlace[];
}) {
  const { flyToLatLon, camera, dataView, setDataView, mapReady, setComparePlaces, mapProjection, setMapProjection } = useGlobe();
  const [shared, setShared] = useState(false);
  const sceneRef = useRef<ReturnType<typeof decodeScene> | null>(null);
  const flownRef = useRef(false);

  // Plain React state applies at once; camera moves wait for the map engine.
  useEffect(() => {
    if (sceneRef.current) return;
    const scene = decodeScene(window.location.search);
    sceneRef.current = scene;
    if (scene.layers) {
      const wanted = new Set(scene.layers);
      setLayers((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, wanted.has(k)])) as Record<LayerId, boolean>);
    }
    if (scene.days) setDays(scene.days);
    if (scene.view) setDataView(scene.view);
    if (scene.projection) setMapProjection(scene.projection);
    if (scene.places.length) setComparePlaces(scene.places);
  }, [setComparePlaces, setDataView, setMapProjection, setLayers, setDays]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!mapReady || !scene || flownRef.current) return;
    flownRef.current = true;
    if (scene.camera) {
      flyToLatLon(scene.camera.lat, scene.camera.lng, { zoom: scene.camera.zoom, user: true });
    } else if (scene.places.length) {
      const first = scene.places[0];
      flyToLatLon(first.lat, first.lon, { name: first.name, zoom: scene.places.length > 1 ? 3.2 : 5.5, user: true });
    }
  }, [mapReady, flyToLatLon]);

  const shareScene = useCallback(async () => {
    const focus = [...(selected ? [selected] : []), ...compare].filter(
      (p, i, all) => all.findIndex((q) => q.lat === p.lat && q.lon === p.lon) === i,
    );
    const qs = encodeScene({
      layers: (Object.keys(layers) as LayerId[]).filter((k) => layers[k]),
      days,
      view: dataView,
      projection: mapProjection,
      places: focus,
      camera,
    });
    const url = `${window.location.origin}/globe${qs ? `?${qs}` : ''}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Copy this link to share the view', url);
    }
    setShared(true);
    window.setTimeout(() => setShared(false), 2200);
  }, [selected, compare, layers, days, dataView, mapProjection, camera]);

  return { shared, shareScene };
}
