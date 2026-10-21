'use client';

import { useEffect, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { isFrontFacing } from './maplibreSetup';
import type { MapProjectionMode, OverlayPath } from '../globe/types';

/** The satellite orbit lines, drawn as SVG over the map. */
export function OrbitSvgOverlay({
  map,
  paths,
  mapProjection,
}: {
  map: MapLibreMap | null;
  paths: OverlayPath[];
  mapProjection: MapProjectionMode;
}) {
  const [pathD, setPathD] = useState('');

  useEffect(() => {
    if (!map || paths.length === 0) {
      setPathD('');
      return;
    }

    const redraw = () => {
      const center = map.getCenter();
      const parts: string[] = [];
      for (const path of paths) {
        let penDown = false;
        let chunk = '';
        let prevX = 0;
        for (const [lon, lat] of path.coordinates) {
          const front =
            mapProjection !== 'globe' || isFrontFacing(center.lat, center.lng, lat, lon, -0.05);
          if (!front) {
            penDown = false;
            continue;
          }
          const pt = map.project([lon, lat]);
          if (!Number.isFinite(pt.x) || !Number.isFinite(pt.y)) {
            penDown = false;
            continue;
          }
          // Screen-space antimeridian / wrap jump
          if (penDown && Math.abs(pt.x - prevX) > map.getContainer().clientWidth * 0.45) {
            penDown = false;
          }
          chunk += penDown ? `L${pt.x.toFixed(1)},${pt.y.toFixed(1)}` : `M${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
          prevX = pt.x;
          penDown = true;
        }
        if (chunk) parts.push(chunk);
      }
      setPathD(parts.join(''));
    };

    redraw();
    map.on('move', redraw);
    map.on('resize', redraw);
    return () => {
      map.off('move', redraw);
      map.off('resize', redraw);
    };
  }, [map, mapProjection, paths]);

  if (!pathD) return null;
  return (
    <svg
      className="globe-orbit-svg pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      aria-hidden
    >
      <path
        d={pathD}
        fill="none"
        stroke="#f43f5e"
        strokeWidth={3.5}
        strokeOpacity={0.95}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={pathD}
        fill="none"
        stroke="#fda4af"
        strokeWidth={1.25}
        strokeOpacity={0.85}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
