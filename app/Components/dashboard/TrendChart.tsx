'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export interface TrendPoint {
  date: string;
  value: number;
}

const H = 150;
const PAD = { l: 38, r: 12, t: 12, b: 24 };

function niceNumber(v: number): string {
  const a = Math.abs(v);
  if (a >= 1e12) return `${(v / 1e12).toFixed(1)}T`;
  if (a >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (a >= 1e4) return `${(v / 1e3).toFixed(0)}k`;
  if (a >= 100) return v.toFixed(0);
  return v.toFixed(1).replace(/\.0$/, '');
}

/** A readable trend line: a few axis labels (not one per point), the latest value called out, and a hover readout. */
export function TrendChart({ data, unit = '' }: { data: TrendPoint[]; unit?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const [W, setW] = useState(320);
  const ref = useRef<SVGSVGElement | null>(null);
  const wrap = useRef<HTMLDivElement | null>(null);

  // Draw at the card's real width so the chart fills it and its text stays the same size.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return undefined;
    const set = () => setW(Math.max(240, Math.round(el.clientWidth)));
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geo = useMemo(() => {
    const values = data.map((d) => d.value);
    let lo = Math.min(...values);
    let hi = Math.max(...values);
    if (lo === hi) {
      lo -= 1;
      hi += 1;
    }
    const pad = (hi - lo) * 0.08;
    lo -= pad;
    hi += pad;
    const x = (i: number) => PAD.l + (i / Math.max(data.length - 1, 1)) * (W - PAD.l - PAD.r);
    const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
    const pts = data.map((d, i) => [x(i), y(d.value)] as const);
    const line = pts.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(' ');
    const area = `${PAD.l},${H - PAD.b} ${line} ${x(data.length - 1).toFixed(1)},${H - PAD.b}`;
    const ticks = Array.from(new Set([0, Math.round((data.length - 1) / 3), Math.round(((data.length - 1) * 2) / 3), data.length - 1]));
    return { lo, hi, x, y, pts, line, area, ticks };
  }, [data, W]);

  const last = data.length - 1;
  const active = hover ?? last;
  const suffix = unit === '%' ? '%' : '';

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const fx = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((fx - PAD.l) / (W - PAD.l - PAD.r)) * (data.length - 1));
    setHover(Math.min(last, Math.max(0, i)));
  };

  return (
    <div className="relative" ref={wrap}>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none overflow-visible" style={{ height: H }}
        role="img"
        aria-label={`Trend from ${data[0].date} to ${data[last].date}. Latest ${niceNumber(data[last].value)}${suffix}.`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--coral, #E4E4E2)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--coral, #E4E4E2)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[geo.hi, (geo.hi + geo.lo) / 2, geo.lo].map((v, i) => (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={geo.y(v)} y2={geo.y(v)} stroke="var(--border)" strokeDasharray="3 4" />
            <text x={PAD.l - 6} y={geo.y(v) + 3} textAnchor="end" className="fill-[var(--text-muted)] font-mono" fontSize="9">{niceNumber(v)}</text>
          </g>
        ))}
        <polygon points={geo.area} fill="url(#trend-fill)" />
        <polyline points={geo.line} fill="none" stroke="var(--coral, #E4E4E2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {geo.ticks.map((i) => (
          <text key={i} x={geo.x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === last ? 'end' : 'middle'} className="fill-[var(--text-muted)] font-mono" fontSize="9">{data[i].date}</text>
        ))}
        <line x1={geo.x(active)} x2={geo.x(active)} y1={PAD.t} y2={H - PAD.b} stroke="var(--border-strong, #666)" strokeWidth="1" opacity={hover == null ? 0.4 : 0.8} />
        <circle cx={geo.pts[active][0]} cy={geo.pts[active][1]} r="4" fill="var(--surface)" stroke="var(--coral, #E4E4E2)" strokeWidth="2" />
      </svg>
      <p className="mt-0.5 flex items-baseline justify-between font-mono text-[11px] text-[var(--text-muted)]" aria-live="polite">
        <span>{data[active].date}</span>
        <span className="text-[13px] font-medium text-[var(--text-primary)]">{niceNumber(data[active].value)}{suffix}</span>
      </p>
    </div>
  );
}
