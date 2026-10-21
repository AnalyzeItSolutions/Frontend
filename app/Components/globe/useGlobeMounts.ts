'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MutableRefObject } from 'react';
import { useRouter } from 'next/navigation';
import type { GlobeMapHandle, GlobeVariant } from './types';
import type { MountId, MountRect } from './globeContext';

export const FLIP_MS = 520;

function readRect(el: HTMLElement | null): MountRect | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 8 || r.height < 8) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

/**
 * Where the one shared map lives: the Chat (mini) or Globe (full) mount, a parking spot when neither is on
 * screen, and the flip animation between them. Also its size, readiness, and pause state.
 */
export function useGlobeMounts({
  engineRef,
  variantRef,
  flushSequenceToQueue,
}: {
  engineRef: MutableRefObject<GlobeMapHandle | null>;
  variantRef: MutableRefObject<GlobeVariant>;
  flushSequenceToQueue: () => void;
}) {
  const router = useRouter();
  const [variant, setVariant] = useState<GlobeVariant>('parked');
  const [mapReady, setMapReady] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [holdMap, setHoldMap] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [stageRect, setStageRect] = useState<MountRect | null>(null);
  const [engineArmed, setEngineArmed] = useState(false);
  const [docHidden, setDocHidden] = useState(false);
  const [slotEl, setSlotEl] = useState<HTMLDivElement | null>(null);
  const mountsRef = useRef<{ mini: HTMLElement | null; full: HTMLElement | null }>({ mini: null, full: null });
  const transitioningRef = useRef(false);
  const parkingRef = useRef<HTMLDivElement | null>(null);
  const flipRef = useRef<HTMLDivElement | null>(null);

  variantRef.current = variant;
  transitioningRef.current = transitioning;

  useEffect(() => {
    setPortalReady(true);
    const el = document.createElement('div');
    el.className = 'globe-map-slot';
    el.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;overflow:hidden';
    setSlotEl(el);
    const onVis = () => setDocHidden(document.hidden);
    onVis();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      el.remove();
      setSlotEl(null);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const syncVariantAndRect = useCallback(() => {
    const full = mountsRef.current.full;
    const mini = mountsRef.current.mini;
    const nextVariant: GlobeVariant = full ? 'full' : mini ? 'mini' : 'parked';
    setVariant(nextVariant);
    variantRef.current = nextVariant;
    const el = full || mini;
    const rect = readRect(el);
    if (rect) setStageRect(rect);
    if (el) {
      setHoldMap(true);
      setEngineArmed(true);
    }
  }, []);

  const registerMount = useCallback(
    (id: MountId, el: HTMLElement | null) => {
      mountsRef.current[id] = el;
      syncVariantAndRect();
    },
    [syncVariantAndRect],
  );

  useEffect(() => {
    const update = () => {
      if (transitioningRef.current) return;
      const el = mountsRef.current.full || mountsRef.current.mini;
      const rect = readRect(el);
      if (rect) setStageRect(rect);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    const ro = new ResizeObserver(update);
    const mini = mountsRef.current.mini;
    const full = mountsRef.current.full;
    if (mini) ro.observe(mini);
    if (full) ro.observe(full);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      ro.disconnect();
    };
  }, [variant, mapReady]);

  useEffect(() => {
    if (variant !== 'parked' || transitioning) {
      setHoldMap(true);
      setEngineArmed(true);
    }
  }, [variant, transitioning]);

  useEffect(() => {
    if (!engineArmed) return;
    setHoldMap(true);
  }, [engineArmed]);

  const expandToFull = useCallback(() => {
    flushSequenceToQueue();
    const miniRect = readRect(mountsRef.current.mini);
    if (miniRect) setStageRect(miniRect);
    setTransitioning(true);
    transitioningRef.current = true;
    router.push('/globe');
    window.setTimeout(() => {
      setTransitioning(false);
      transitioningRef.current = false;
      engineRef.current?.resize();
      syncVariantAndRect();
    }, FLIP_MS + 80);
  }, [flushSequenceToQueue, router, syncVariantAndRect, engineRef]);

  const handleEngineReady = useCallback((handle: GlobeMapHandle) => {
    engineRef.current = handle;
    setMapReady(true);
    handle.resize();
  }, [engineRef]);

  useEffect(() => {
    if (!mapReady || transitioning) return;
    const t = window.setTimeout(() => engineRef.current?.resize(), 40);
    return () => window.clearTimeout(t);
  }, [stageRect?.width, stageRect?.height, mapReady, transitioning, variant]);

  useLayoutEffect(() => {
    const slot = slotEl;
    if (!slot) return;
    const full = mountsRef.current.full;
    const mini = mountsRef.current.mini;
    let target: HTMLElement | null = null;
    if (transitioning && flipRef.current) target = flipRef.current;
    else if (full) target = full;
    else if (mini) target = mini;
    else target = parkingRef.current;
    if (target && slot.parentElement !== target) {
      target.appendChild(slot);
    }
    slot.style.pointerEvents = variant === 'full' && !transitioning ? 'auto' : 'none';
    if (!transitioning) engineRef.current?.resize();
  }, [slotEl, transitioning, variant, stageRect, holdMap, portalReady]);

  return {
    variant,
    mapReady,
    transitioning,
    holdMap,
    portalReady,
    stageRect,
    engineArmed,
    docHidden,
    slotEl,
    parkingRef,
    flipRef,
    mountsRef,
    registerMount,
    expandToFull,
    handleEngineReady,
  };
}
