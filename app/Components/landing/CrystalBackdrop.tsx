'use client';

import React, { useEffect, useRef, type MutableRefObject } from 'react';
import './crystalBackdrop.css';

interface CrystalBackdropProps {
  scrollProgressRef: MutableRefObject<number>;
  isVisible?: boolean;
}

/** Deterministic pseudo-random so server and client render the same sparkles. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SPARKS = (() => {
  const rand = mulberry32(11);
  return Array.from({ length: 28 }, () => ({
    left: `${(rand() * 100).toFixed(2)}%`,
    top: `${(8 + rand() * 80).toFixed(2)}%`,
    size: 2 + Math.round(rand() * 2),
    delay: `${(-rand() * 6).toFixed(2)}s`,
    duration: `${(4 + rand() * 4).toFixed(2)}s`,
  }));
})();

/** Spires along the horizon: x, height, width as a share of the 1200-wide strip. */
const SPIRES = (() => {
  const rand = mulberry32(7);
  return Array.from({ length: 26 }, (_, i) => {
    const x = (i / 25) * 1200 + (rand() - 0.5) * 40;
    const edge = Math.abs(x - 600) / 600; // taller toward the edges, low in the middle so the crystal stays clear
    const h = 30 + edge * 150 * (0.5 + rand() * 0.6);
    const w = 14 + rand() * 22;
    const lean = (rand() - 0.5) * 12;
    return { x, h, w, lean };
  });
})();

/**
 * Landing backdrop: the faceted crystal from the logo over a soft horizon.
 * Drawn with SVG and CSS so every animation is transform or opacity and runs on the compositor,
 * with or without a GPU. Scroll writes one CSS variable (--p) that drives the descent.
 */
export function CrystalBackdrop({ scrollProgressRef, isVisible = true }: CrystalBackdropProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let last = -1;
    let frame = 0;
    const write = () => {
      frame = 0;
      const p = Math.round(Math.min(Math.max(scrollProgressRef.current, 0), 1) * 1000) / 1000;
      if (p !== last) {
        last = p;
        root.style.setProperty('--p', String(p));
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(write);
    };
    write();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [scrollProgressRef]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={`crystal-backdrop${isVisible ? '' : ' is-hidden'}`}
    >
      <div className="cb-sky" />
      <div className="cb-glow" />

      <div className="cb-mist cb-mist-a" />
      <div className="cb-mist cb-mist-b" />
      <div className="cb-mist cb-mist-c" />

      <div className="cb-sparks">
        {SPARKS.map((s, i) => (
          <span
            key={i}
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              animationDelay: s.delay,
              animationDuration: s.duration,
            }}
          />
        ))}
      </div>

      <div className="cb-stage">
        <div className="cb-ring cb-ring-a" />
        <div className="cb-ring cb-ring-b" />
        <div className="cb-float">
          <svg className="cb-crystal" viewBox="-100 -130 200 260" role="presentation">
            <defs>
              <linearGradient id="cb-core" x1="0" y1="-1" x2="0" y2="1">
                <stop offset="0" stopColor="var(--cb-core-hi)" />
                <stop offset="1" stopColor="var(--cb-core-lo)" />
              </linearGradient>
              <radialGradient id="cb-heart" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor="var(--cb-heart)" stopOpacity="0.95" />
                <stop offset="1" stopColor="var(--cb-heart)" stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* Upper crown: four facets meeting at the tip */}
            <polygon className="cb-f cb-f1" points="0,-120 -78,-30 -26,-18" />
            <polygon className="cb-f cb-f2" points="0,-120 -26,-18 26,-18" />
            <polygon className="cb-f cb-f3" points="0,-120 26,-18 78,-30" />
            <polygon className="cb-f cb-f4" points="-78,-30 -26,-18 -40,10" />
            <polygon className="cb-f cb-f5" points="78,-30 26,-18 40,10" />
            {/* Girdle */}
            <polygon className="cb-f cb-f6" points="-26,-18 26,-18 40,10 -40,10" />
            {/* Lower pavilion: long facets down to the point */}
            <polygon className="cb-f cb-f7" points="-78,-30 -40,10 0,120" />
            <polygon className="cb-f cb-f8" points="-40,10 40,10 0,120" />
            <polygon className="cb-f cb-f9" points="78,-30 40,10 0,120" />
            <ellipse className="cb-heart" cx="0" cy="-6" rx="46" ry="46" fill="url(#cb-heart)" />
            <polygon
              className="cb-edge"
              points="0,-120 78,-30 0,120 -78,-30"
              fill="none"
            />
            <polyline className="cb-edge cb-edge-in" points="-78,-30 -26,-18 26,-18 78,-30" fill="none" />
            <polyline className="cb-edge cb-edge-in" points="-26,-18 0,-120 26,-18" fill="none" />
            <polyline className="cb-edge cb-edge-in" points="-40,10 0,120 40,10" fill="none" />
          </svg>
        </div>
      </div>

      <svg className="cb-spires" viewBox="0 0 1200 220" preserveAspectRatio="xMidYMax slice">
        {SPIRES.map((s, i) => (
          <polygon
            key={i}
            points={`${(s.x - s.w / 2).toFixed(1)},220 ${(s.x + s.lean).toFixed(1)},${(220 - s.h).toFixed(1)} ${(s.x + s.w / 2).toFixed(1)},220`}
          />
        ))}
      </svg>
    </div>
  );
}
