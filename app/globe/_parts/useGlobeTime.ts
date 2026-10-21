'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SPEEDS, playbackStep, stepCursor } from '../../Components/globe/timeline.mjs';

export const HISTOGRAM_BUCKETS = 48;

/** The time window (days back), the playhead inside it (1 = live), play speed, trail and the play timer. */
export function useGlobeTime() {
  const [days, setDaysState] = useState(7);
  const [cursor, setCursor] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [trail, setTrail] = useState('all');
  const keepCursorOnce = useRef(false);

  // A new window starts live and stopped, unless a shared link just set the playhead.
  useEffect(() => {
    if (keepCursorOnce.current) {
      keepCursorOnce.current = false;
      return;
    }
    setCursor(1);
    setPlaying(false);
  }, [days]);

  // Playback: about 8 s across the window at 1x. Stops at "now".
  useEffect(() => {
    if (!playing) return undefined;
    const id = window.setInterval(() => {
      setCursor((c) => {
        const next = c + playbackStep(speed);
        if (next >= 1) {
          setPlaying(false);
          return 1;
        }
        return next;
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [playing, speed]);

  const cycleSpeed = useCallback(() => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length]), []);

  const step = useCallback((direction: number, slices = 1) => {
    setPlaying(false);
    setCursor((c) => stepCursor(c, direction, HISTOGRAM_BUCKETS, slices));
  }, []);

  const scrubTo = useCallback((fraction: number) => {
    setPlaying(false);
    setCursor(Math.min(1, Math.max(0, fraction)));
  }, []);

  /** Apply a shared link's window, playhead and trail together. */
  const restore = useCallback((next: { days?: number | null; cursor?: number | null; trail?: string | null }) => {
    if (next.trail) setTrail(next.trail);
    if (next.days && next.days !== days) {
      if (next.cursor != null) keepCursorOnce.current = true;
      setDaysState(next.days);
    }
    if (next.cursor != null) setCursor(next.cursor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    days,
    setDays: setDaysState,
    cursor,
    setCursor,
    playing,
    setPlaying,
    speed,
    cycleSpeed,
    trail,
    setTrail,
    step,
    scrubTo,
    restore,
  };
}
