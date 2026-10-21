'use client';

import { Marker } from 'react-map-gl/maplibre';
import { motion } from 'motion/react';
import type { BarRow } from './metricModes';
import type { SourcePoint } from '../globe/types';

/** Bars draw mode: one column per strong point, growing in, labelled only where it is strongest. */
export function BarMarkers({
  rows,
  isFacing,
  selectable,
  onSelect,
}: {
  rows: BarRow[];
  isFacing: (id: string) => boolean;
  selectable: boolean;
  onSelect?: (point: SourcePoint) => void;
}) {
  return (
    <>
      {rows.map(({ point, w, color, labelled }) => {
        const facing = isFacing(point.id);
        const height = 10 + Math.round(w * 52);
        return (
          <Marker
            key={`bar-${point.id}`}
            longitude={point.lon}
            latitude={point.lat}
            anchor="bottom"
            style={{ pointerEvents: facing && selectable ? 'auto' : 'none', opacity: facing ? 1 : 0, transition: 'opacity 200ms' }}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              if (selectable && facing) onSelect?.(point);
            }}
          >
            <span className="flex flex-col items-center" title={point.label}>
              {labelled ? (
                <span className="mb-0.5 max-w-[7rem] truncate rounded bg-[var(--surface)]/80 px-1 text-[11px] font-mono text-[var(--text-primary)]">{point.label}</span>
              ) : null}
              <motion.span
                className="w-2.5 rounded-t-sm shadow-sm"
                style={{ background: color }}
                initial={{ height: 0 }}
                animate={{ height }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              />
            </span>
          </Marker>
        );
      })}
    </>
  );
}
