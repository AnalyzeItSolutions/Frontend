import type { Map as MapLibreMap } from 'maplibre-gl';

/** Freeze the map's render loop while it is off screen, and wake it again. */
type PausableMap = MapLibreMap & { __origTriggerRepaint?: () => void };

export function pauseMapLoop(map: MapLibreMap) {
  const m = map as PausableMap;
  try {
    map.stop();
  } catch {
    /* ignore */
  }
  if (!m.__origTriggerRepaint) {
    m.__origTriggerRepaint = map.triggerRepaint.bind(map);
    map.triggerRepaint = () => {};
  }
}

export function resumeMapLoop(map: MapLibreMap) {
  const m = map as PausableMap;
  if (m.__origTriggerRepaint) {
    map.triggerRepaint = m.__origTriggerRepaint;
    m.__origTriggerRepaint = undefined;
  }
  try {
    map.triggerRepaint();
  } catch {
    /* ignore */
  }
}
