'use client';

import { useEffect, useMemo, useState } from 'react';
import { aqiGradient, temperatureColor } from '../../Components/globe/pinColors.mjs';
import { fieldCoordinates, renderField } from '../../Components/globe/fieldImage.mjs';
import { RAINVIEWER_INDEX, RADAR_REFRESH_MS, activeRasters } from '../../Components/globe/rasterLayers.mjs';
import { useGlobe } from '../../Components/globe/useGlobe';

type Events = Array<Record<string, unknown>>;

/** Radar and satellite tiles plus the weather / air-quality colour fields, handed to the map as raster overlays. */
export function useGlobeRasters(
  radar: boolean,
  clouds: boolean,
  fieldEvents: { weather: Events; air_quality: Events },
) {
  const { setOverlayRasters } = useGlobe();
  const [radarIndex, setRadarIndex] = useState<unknown>(null);

  // The radar frame list is re-read every few minutes; tiles come straight from the provider.
  useEffect(() => {
    if (!radar) return undefined;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(RAINVIEWER_INDEX, { cache: 'no-store' });
        if (res.ok && !cancelled) setRadarIndex(await res.json());
      } catch {
        /* radar is optional: no frame list simply draws nothing */
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), RADAR_REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [radar]);

  // Each field is painted once per data change, not on every render.
  const airRaster = useMemo(
    () => paintField('field-air', fieldEvents.air_quality, (e) => (e.us_aqi ?? e.european_aqi) as number | null, aqiGradient),
    [fieldEvents.air_quality],
  );
  const weatherRaster = useMemo(
    () => paintField('field-weather', fieldEvents.weather, (e) => e.temperature_c as number | null, temperatureColor),
    [fieldEvents.weather],
  );

  useEffect(() => {
    const fields = [airRaster, weatherRaster].filter(Boolean) as NonNullable<typeof airRaster>[];
    setOverlayRasters([...fields, ...activeRasters({ radar, clouds }, radarIndex)]);
  }, [airRaster, weatherRaster, radar, clouds, radarIndex, setOverlayRasters]);

  useEffect(() => () => setOverlayRasters([]), [setOverlayRasters]);
}

function paintField(
  id: string,
  events: Events | undefined,
  valueOf: (e: Record<string, unknown>) => number | null,
  colorOf: (v: number) => string | null,
) {
  if (!events || events.length === 0) return null;
  const img = renderField({ events, valueOf, colorOf, width: 720 });
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.putImageData(new ImageData(img.data, img.width, img.height), 0, 0);
  return { id, image: { url: canvas.toDataURL('image/png'), coordinates: fieldCoordinates() as [number, number][] }, opacity: 0.9 };
}
