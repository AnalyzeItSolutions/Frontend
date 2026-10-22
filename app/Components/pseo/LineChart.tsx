// A line chart drawn on the server as SVG: visible to crawlers, no JavaScript, and it follows the site theme through
// currentColor and CSS variables. Gaps in the series (missing years) break the line instead of being bridged.

type Point = { x: number; y: number | null };

const W = 640, H = 240, L = 56, R = 12, T = 12, B = 28;

function niceTicks(min: number, max: number, count = 4) {
  if (min === max) { const d = Math.abs(min) || 1; min -= d / 2; max += d / 2; }
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.5; v += step) ticks.push(+v.toPrecision(12));
  return ticks;
}

export function LineChart({ points, label, format }: { points: Point[]; label: string; format: (v: number) => string }) {
  const ys = points.map((p) => p.y).filter((y): y is number => y != null);
  if (ys.length < 2) return null;
  const ticks = niceTicks(Math.min(...ys), Math.max(...ys));
  const y0 = ticks[0], y1 = ticks[ticks.length - 1];
  const x0 = points[0].x, x1 = points[points.length - 1].x;
  const sx = (x: number) => L + ((x - x0) / (x1 - x0 || 1)) * (W - L - R);
  const sy = (y: number) => T + (1 - (y - y0) / (y1 - y0 || 1)) * (H - T - B);
  const segments: string[] = [];
  let cur = '';
  for (const p of points) {
    if (p.y == null) { if (cur) segments.push(cur); cur = ''; continue; }
    cur += `${cur ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`;
  }
  if (cur) segments.push(cur);
  const span = x1 - x0;
  const step = span > 40 ? 10 : span > 20 ? 5 : span > 8 ? 2 : 1;
  const xTicks = points.map((p) => p.x).filter((x) => x % step === 0);
  const last = [...points].reverse().find((p) => p.y != null)!;
  return (
    <figure className="space-y-1">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="w-full h-auto text-[var(--text-primary)]">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={sy(t)} y2={sy(t)} stroke="currentColor" strokeOpacity={0.12} />
            <text x={L - 6} y={sy(t) + 4} textAnchor="end" fontSize={11} fill="currentColor" fillOpacity={0.6}>{format(t)}</text>
          </g>
        ))}
        {xTicks.map((x) => (
          <text key={x} x={sx(x)} y={H - 8} textAnchor="middle" fontSize={11} fill="currentColor" fillOpacity={0.6}>{x}</text>
        ))}
        {segments.map((d, i) => <path key={i} d={d} fill="none" stroke="var(--brand, currentColor)" strokeWidth={2} strokeLinejoin="round" />)}
        <circle cx={sx(last.x)} cy={sy(last.y!)} r={3.5} fill="var(--brand, currentColor)" />
      </svg>
      <figcaption className="text-xs text-[var(--text-muted)]">{label}</figcaption>
    </figure>
  );
}
