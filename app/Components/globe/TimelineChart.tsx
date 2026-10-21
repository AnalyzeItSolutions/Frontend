'use client';

import { useCallback, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { formatCursor } from './scene.mjs';
import type { activityBuckets } from './timeline.mjs';

type Activity = ReturnType<typeof activityBuckets>;

const W = 240;
const H = 46;

/**
 * Event activity across the window, stacked by layer. The playhead is draggable and keyboard-operable;
 * the part of the window after it is dimmed (it has not "happened yet" in the replay).
 */
export function TimelineChart({
  activity,
  colors,
  cursor,
  days,
  onScrub,
  onStep,
  onToggle,
}: {
  activity: Activity;
  colors: Record<string, string>;
  cursor: number;
  days: number;
  onScrub: (fraction: number) => void;
  onStep: (direction: number, slices?: number) => void;
  onToggle: () => void;
}) {
  const ref = useRef<SVGSVGElement | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const dragging = useRef(false);
  const n = activity.buckets.length;
  const bw = W / n;

  const fractionAt = useCallback((clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return cursor;
    return (clientX - rect.left) / rect.width;
  }, [cursor]);

  const hovered = hover != null ? activity.buckets[hover] : null;
  const playheadX = cursor * W;

  return (
    <div className="relative">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="h-[46px] w-full touch-none select-none rounded-md bg-[var(--surface-2)] outline-none focus-visible:ring-2 focus-visible:ring-brand"
        role="slider"
        tabIndex={0}
        aria-label="Event timeline"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(cursor * 100)}
        aria-valuetext={`${activity.buckets.reduce((a, b) => a + b.total, 0)} events in the window`}
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          onScrub(fractionAt(e.clientX));
        }}
        onPointerMove={(e) => {
          const f = fractionAt(e.clientX);
          setHover(Math.min(n - 1, Math.max(0, Math.floor(f * n))));
          if (dragging.current) onScrub(f);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerLeave={() => setHover(null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') onStep(-1, e.shiftKey ? 6 : 1);
          else if (e.key === 'ArrowRight') onStep(1, e.shiftKey ? 6 : 1);
          else if (e.key === 'Home') onScrub(0);
          else if (e.key === 'End') onScrub(1);
          else if (e.key === ' ') onToggle();
          else return;
          e.preventDefault();
        }}
      >
        {activity.buckets.map((b, i) => {
          const layers = Object.entries(b.layers);
          const total = b.total || 1;
          const full = (b.total / activity.max) * (H - 8);
          let y = H - 2;
          return (
            <g key={i} opacity={(i + 0.5) / n > cursor ? 0.28 : 1}>
              {layers.map(([id, count]) => {
                const h = Math.max(1, (count / total) * full);
                y -= h;
                return <rect key={id} x={i * bw + 0.4} y={y} width={Math.max(1, bw - 0.8)} height={h} rx={0.8} fill={colors[id] || '#A7A7A7'} />;
              })}
            </g>
          );
        })}
        <motion.line
          x1={playheadX}
          x2={playheadX}
          y1={0}
          y2={H}
          stroke="var(--text-primary)"
          strokeWidth={1.4}
          animate={{ x1: playheadX, x2: playheadX }}
          transition={{ duration: 0.08, ease: 'linear' }}
        />
        <circle cx={playheadX} cy={4} r={2.6} fill="var(--text-primary)" />
      </svg>
      {hovered ? (
        <div
          className="pointer-events-none absolute -top-7 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)] shadow-sm"
          style={{ left: `${(((hover ?? 0) + 0.5) / n) * 100}%` }}
        >
          {hovered.total} event{hovered.total === 1 ? '' : 's'} · {formatCursor(hovered.start, days)}
        </div>
      ) : null}
      <div className="mt-0.5 flex justify-between font-mono text-[9px] text-[var(--text-muted)]" aria-hidden>
        <span>{days === 1 ? '24 h ago' : `${days} d ago`}</span>
        <span>now</span>
      </div>
    </div>
  );
}
