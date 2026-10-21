import { strongestRows } from '../../Components/globe/dataQuality.mjs';
import type { SourcePoint } from '../../Components/globe/types';

export function RankedBars({ points }: { points: SourcePoint[] }) {
  const ranked = strongestRows(points, 8) as { unit: string; rows: Array<{ id: string; label: string; score: number }> };
  const rows = ranked.rows;
  if (!rows.length) return null;
  const max = rows[0].score || 1;
  return (
    <div className="space-y-1.5 pt-1">
      <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
        Strongest {ranked.unit ? `· ${ranked.unit}` : 'on the map'}
      </p>
      {rows.map((row) => (
        <div key={row.id} className="grid grid-cols-[1fr_auto] items-center gap-2">
          <div className="min-w-0">
            <div className="truncate text-[11px] text-[var(--text-secondary)]">{row.label}</div>
            <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
                style={{ width: `${Math.max(8, (row.score / max) * 100)}%` }}
              />
            </div>
          </div>
          <span className="font-mono text-[11px] tabular-nums text-[var(--text-muted)]">
            {Number.isInteger(row.score) ? row.score : row.score.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
}
