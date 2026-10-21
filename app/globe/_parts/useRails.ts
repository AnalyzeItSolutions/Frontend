'use client';

import { useCallback, useEffect, useState } from 'react';

const RAIL_KEY = 'analyzeit_globe_rails';
export const LEFT_DEFAULT = 280;
export const RIGHT_DEFAULT = 360;
const LEFT_MIN = 200;
const LEFT_MAX = 480;
const RIGHT_MIN = 240;
const RIGHT_MAX = 560;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function readRails(): { left: number; right: number } {
  try {
    const raw = localStorage.getItem(RAIL_KEY);
    if (!raw) return { left: LEFT_DEFAULT, right: RIGHT_DEFAULT };
    const parsed = JSON.parse(raw) as { left?: number; right?: number };
    return {
      left: clamp(Number(parsed.left) || LEFT_DEFAULT, LEFT_MIN, LEFT_MAX),
      right: clamp(Number(parsed.right) || RIGHT_DEFAULT, RIGHT_MIN, RIGHT_MAX),
    };
  } catch {
    return { left: LEFT_DEFAULT, right: RIGHT_DEFAULT };
  }
}

/** Widths of the two side panels: remembered between visits, draggable, resettable. */
export function useRails() {
  const [leftRail, setLeftRail] = useState(LEFT_DEFAULT);
  const [rightRail, setRightRail] = useState(RIGHT_DEFAULT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const rails = readRails();
    setLeftRail(rails.left);
    setRightRail(rails.right);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(RAIL_KEY, JSON.stringify({ left: leftRail, right: rightRail }));
    } catch {
      /* ignore */
    }
  }, [leftRail, rightRail, ready]);

  const startResize = useCallback(
    (side: 'left' | 'right', ev: React.PointerEvent<HTMLDivElement>) => {
      ev.preventDefault();
      const startX = ev.clientX;
      const start = side === 'left' ? leftRail : rightRail;
      ev.currentTarget.setPointerCapture(ev.pointerId);
      const onMove = (e: PointerEvent) => {
        const dx = e.clientX - startX;
        if (side === 'left') setLeftRail(clamp(start + dx, LEFT_MIN, LEFT_MAX));
        else setRightRail(clamp(start - dx, RIGHT_MIN, RIGHT_MAX));
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [leftRail, rightRail],
  );

  const reset = useCallback(() => {
    setLeftRail(LEFT_DEFAULT);
    setRightRail(RIGHT_DEFAULT);
  }, []);

  return { leftRail, rightRail, setLeftRail, setRightRail, startResize, reset };
}
