'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SPEEDS, advancePlayhead, bucketsFor, playbackStep, stepCursor, trailForWindow } from '../../Components/globe/timeline.mjs';

/** The time window (days back), the playhead inside it (1 = live), play speed, loop, trail and the play timer. */
export function useGlobeTime() {
  const [days, setDaysState] = useState(7);
  const [cursor, setCursor] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [loop, setLoop] = useState(false);
  const [trail, setTrail] = useState('all');
  const keepCursorOnce = useRef(false);
  const buckets = bucketsFor(days);

  // A new window starts live and stopped, unless a shared link just set the playhead.
  useEffect(() => {
    if (keepCursorOnce.current) {
      keepCursorOnce.current = false;
      return;
    }
    setCursor(1);
    setPlaying(false);
  }, [days]);

  // Playback: 8-20 s across the window at 1x, longer for a longer window. Stops at "now" unless looping.
  useEffect(() => {
    if (!playing) return undefined;
    const delta = playbackStep(speed, days);
    const id = window.setInterval(() => {
      setCursor((c) => {
        const next = advancePlayhead(c, delta, loop);
        if (next.done) setPlaying(false);
        return next.cursor;
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [playing, speed, days, loop]);

  /** A trail the new window does not offer (6 h on 30 d) goes back to All. */
  const setDays = useCallback((next: number) => {
    setDaysState(next);
    setTrail((t) => trailForWindow(t, next));
  }, []);

  const cycleSpeed = useCallback(() => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length]), []);

  const step = useCallback((direction: number, slices = 1) => {
    setPlaying(false);
    setCursor((c) => stepCursor(c, direction, buckets, slices));
  }, [buckets]);

  const scrubTo = useCallback((fraction: number) => {
    setPlaying(false);
    setCursor(Math.min(1, Math.max(0, fraction)));
  }, []);

  /** Apply a shared link's window, playhead and trail together. */
  const restore = useCallback((next: { days?: number | null; cursor?: number | null; trail?: string | null }) => {
    if (next.trail) setTrail(trailForWindow(next.trail, next.days || days));
    if (next.days && next.days !== days) {
      if (next.cursor != null) keepCursorOnce.current = true;
      setDaysState(next.days);
    }
    if (next.cursor != null) setCursor(next.cursor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    days,
    setDays,
    cursor,
    setCursor,
    playing,
    setPlaying,
    speed,
    cycleSpeed,
    loop,
    setLoop,
    buckets,
    trail,
    setTrail,
    step,
    scrubTo,
    restore,
  };
}
