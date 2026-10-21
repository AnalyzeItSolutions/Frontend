'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { globeAskPrompt } from '../../Components/globe/dataQuality.mjs';
import { selectionLoadsPlaceContext } from '../../Components/globe/liveOverlays.mjs';
import { useGlobe } from '../../Components/globe/useGlobe';
import type { SourcePoint } from '../../Components/globe/types';
import { fetchPlaceContext, searchPlaces, type GeoSearchHit, type PlaceContext } from '../../lib/geoApi';
import { placeId, placeLabel, type ComparePlace, type Selected } from './layers';

/** The selected place, its context card, place search, the compare list and the hand-off to Chat. */
export function useGlobePlaces() {
  const router = useRouter();
  const { flyToLatLon, selectedPoint, setOnMapPlaceSelect, setComparePlaces, setActiveHub } = useGlobe();
  const [selected, setSelected] = useState<Selected | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<SourcePoint | null>(null);
  const [context, setContext] = useState<PlaceContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<GeoSearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [compare, setCompare] = useState<ComparePlace[]>([]);
  const fetchGen = useRef(0);
  const searchGen = useRef(0);
  const contextAbort = useRef<AbortController | null>(null);

  const loadContext = useCallback(async (lat: number, lon: number, meta?: { name?: string; country?: string }) => {
    contextAbort.current?.abort();
    const ac = new AbortController();
    contextAbort.current = ac;
    const gen = ++fetchGen.current;
    setSelectedEvent(null);
    setSelected({ lat, lon, name: meta?.name, country: meta?.country });
    setContext(null); // never show the previous place's card under the new name
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPlaceContext(lat, lon, { signal: ac.signal });
      if (gen !== fetchGen.current) return;
      setContext(data);
      const name = meta?.name || data.place?.name || undefined;
      const country = meta?.country || data.place?.country || undefined;
      if (name || country) {
        setSelected((prev) =>
          prev && prev.lat === lat && prev.lon === lon
            ? { ...prev, name: name || prev.name, country: country || prev.country }
            : prev,
        );
      }
    } catch (err) {
      if (gen !== fetchGen.current || ac.signal.aborted) return;
      const message = err instanceof Error ? err.message : 'Could not load place context';
      setError(message === 'The operation was aborted.' ? 'Place context timed out. Retry to load this place again.' : message);
    } finally {
      if (gen === fetchGen.current) setLoading(false);
    }
  }, []);

  const goTo = useCallback(
    (lat: number, lon: number, opts?: { name?: string; country?: string; zoom?: number; hub?: string | null }) => {
      flyToLatLon(lat, lon, {
        zoom: opts?.zoom ?? 5.8,
        name: opts?.name,
        country: opts?.country,
        hub: opts?.hub ?? null,
        user: true,
      });
      void loadContext(lat, lon, { name: opts?.name, country: opts?.country });
    },
    [flyToLatLon, loadContext],
  );

  const pickHit = useCallback(
    (hit: GeoSearchHit) => {
      setQuery(hit.name);
      setHits([]);
      goTo(hit.lat, hit.lon, { name: hit.name, country: hit.country || undefined, zoom: 6.5, hub: null });
    },
    [goTo],
  );

  const clearSelection = useCallback(() => {
    setContext(null);
    setError(null);
    setSelected(null);
    setSelectedEvent(null);
    setActiveHub(null);
  }, [setActiveHub]);

  // Debounced place search.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setSearching(false);
      return;
    }
    const gen = ++searchGen.current;
    setSearching(true);
    const t = window.setTimeout(() => {
      void searchPlaces(q, 8)
        .then((rows) => gen === searchGen.current && setHits(rows))
        .catch(() => gen === searchGen.current && setHits([]))
        .finally(() => gen === searchGen.current && setSearching(false));
    }, 220);
    return () => window.clearTimeout(t);
  }, [query]);

  // Compare list: up to three places, kept in step with the map.
  const toggleCompare = useCallback(() => {
    if (!selected) return;
    const id = placeId(selected);
    setCompare((prev) => {
      if (prev.some((p) => p.id === id)) return prev.filter((p) => p.id !== id);
      if (prev.length >= 3) return prev;
      return [...prev, { ...selected, id, context }];
    });
  }, [selected, context]);

  useEffect(() => {
    if (!selected || !context) return;
    const id = placeId(selected);
    setCompare((prev) => prev.map((p) => (p.id === id ? { ...p, context, name: selected.name || p.name } : p)));
  }, [selected, context]);

  useEffect(() => {
    setComparePlaces(compare.map((p) => ({ lat: p.lat, lon: p.lon, name: p.name })));
  }, [compare, setComparePlaces]);

  // Clicking the map: an event shows its own card, a plain place loads context.
  useEffect(() => {
    setOnMapPlaceSelect((place) => {
      setActiveHub(null);
      if (!selectionLoadsPlaceContext(place)) {
        setSelectedEvent(place.event!);
        setSelected({ lat: place.lat, lon: place.lon, name: place.name });
        setContext(null);
        setError(null);
        setLoading(false);
        return;
      }
      setSelectedEvent(null);
      void loadContext(place.lat, place.lon, { name: place.name });
    });
    return () => setOnMapPlaceSelect(null);
  }, [loadContext, setActiveHub, setOnMapPlaceSelect]);

  // A place Chat already flew to opens here with its card.
  const hydratedFromChat = useRef(false);
  useEffect(() => {
    if (hydratedFromChat.current || !selectedPoint) return;
    hydratedFromChat.current = true;
    void loadContext(selectedPoint.lat, selectedPoint.lon, { name: selectedPoint.label });
  }, [loadContext, selectedPoint]);

  const sendToResearch = useCallback(
    (prompt: string, places?: Selected[]) => {
      const list = places?.length ? places : selected ? [selected] : [];
      const labels = list.map(placeLabel).join(' · ');
      const ids = list.map((p) => `${p.lat},${p.lon}`).join('|');
      const qs = new URLSearchParams();
      qs.set('q', globeAskPrompt(prompt || (labels ? `Analyze ${labels}` : 'Analyze this place'), list));
      if (labels) qs.set('place', labels);
      if (ids) qs.set('placeIds', ids);
      router.push(`/research?${qs.toString()}`);
    },
    [router, selected],
  );

  const askAboutPlace = useCallback(() => {
    if (context?.chat_prompt) {
      sendToResearch(context.chat_prompt, selected ? [selected] : undefined);
      return;
    }
    if (!selected) return;
    const label = selected.name || `${selected.lat.toFixed(2)}°, ${selected.lon.toFixed(2)}°`;
    sendToResearch(
      `Ask about this place: ${label}${selected.country ? ` (${selected.country})` : ''}. Summarize signals, risks, and what to watch.`,
      [selected],
    );
  }, [context, selected, sendToResearch]);

  const askCompare = useCallback(() => {
    if (compare.length < 2) return;
    sendToResearch(
      `Compare these places side by side: ${compare.map(placeLabel).join(' vs ')}. Call out weather, air quality, market, and notable differences.`,
      compare,
    );
  }, [compare, sendToResearch]);

  return {
    selected,
    selectedEvent,
    context,
    loading,
    error,
    query,
    setQuery,
    hits,
    setHits,
    searching,
    compare,
    setCompare,
    inCompare: selected ? compare.some((p) => p.id === placeId(selected)) : false,
    loadContext,
    goTo,
    pickHit,
    clearSelection,
    toggleCompare,
    sendToResearch,
    askAboutPlace,
    askCompare,
    setSelectedEvent,
    setSelected,
  };
}
