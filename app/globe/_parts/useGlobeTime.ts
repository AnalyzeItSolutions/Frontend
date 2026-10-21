'use client';

import { useEffect, useState } from 'react';

/** The time window (days back), the replay position inside it (1 = live) and the play timer. */
export function useGlobeTime() {
  const [days, setDays] = useState(7);
  const [cursor, setCursor] = useState(1);
  const [playing, setPlaying] = useState(false);

  // A new window starts live and stopped.
  useEffect(() => {
    setCursor(1);
    setPlaying(false);
  }, [days]);

  // Playback: about 8 s from the start of the window to now.
  useEffect(() => {
    if (!playing) return undefined;
    const id = window.setInterval(() => {
      setCursor((c) => {
        const next = c + 0.0125;
        if (next >= 1) {
          setPlaying(false);
          return 1;
        }
        return next;
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [playing]);

  return { days, setDays, cursor, setCursor, playing, setPlaying };
}
