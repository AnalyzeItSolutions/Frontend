// Turns a World Bank series into the figures and sentences on a /data page. Pure functions, no I/O, so the tests can check
// that every sentence follows from the numbers. Rates and shares ("%" in the indicator name) change in percentage points;
// levels (people, US$, tonnes) change in percent, with a compound annual rate when both ends are positive.

/** Lower-case the first letter for use mid-sentence, but leave acronyms (GDP, CO2) alone. */
export const lowerFirst = (s) => (/^[A-Z][A-Z0-9]/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));

export function kindOf(name) {
  if (/%|\bper ?cent\b/i.test(name)) return 'pct';
  if (/US\$/.test(name)) return 'usd';
  return 'level';
}

const WORDS = [[1e12, 'trillion'], [1e9, 'billion'], [1e6, 'million']];

/** Human-readable number: 3.91 trillion, 1,428,627,663 → 1.43 billion, 4.951 → 4.95. */
export function fmtNum(v) {
  if (v == null || !Number.isFinite(v)) return '—';
  const a = Math.abs(v);
  for (const [n, w] of WORDS) if (a >= n) return `${(v / n).toLocaleString('en-US', { maximumFractionDigits: 2 })} ${w}`;
  if (a >= 1000) return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (a >= 1) return v.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (a === 0) return '0';
  if (a >= 0.01) return v.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return v.toLocaleString('en-US', { maximumSignificantDigits: 3 });
}

export function fmtValue(v, kind) {
  if (v == null || !Number.isFinite(v)) return '—';
  if (kind === 'pct') return `${fmtNum(v)}%`;
  if (kind === 'usd') return `${v < 0 ? '−' : ''}US$${fmtNum(Math.abs(v))}`;
  return fmtNum(v);
}

/** Exact value for tables: full digits with grouping, rounded to what the size of the number deserves. */
export function fmtExact(v) {
  if (v == null || !Number.isFinite(v)) return '—';
  const a = Math.abs(v);
  return v.toLocaleString('en-US', { maximumFractionDigits: a >= 1000 ? 0 : a >= 1 ? 2 : 4 });
}

const at = (pts, year) => pts.find((p) => p.year === year && p.value != null);

/** Key figures from a series of { year, value } (oldest first, may contain nulls). */
export function summarize(points, kind) {
  const pts = points.filter((p) => p.value != null);
  if (!pts.length) return null;
  const latest = pts[pts.length - 1];
  const first = pts[0];
  const max = pts.reduce((a, b) => (b.value > a.value ? b : a));
  const min = pts.reduce((a, b) => (b.value < a.value ? b : a));
  const back = (n) => at(pts, latest.year - n);
  const change = (from) => {
    if (!from) return null;
    if (kind === 'pct') return { from, points: latest.value - from.value };
    const pct = from.value !== 0 ? ((latest.value - from.value) / Math.abs(from.value)) * 100 : null;
    const years = latest.year - from.year;
    const cagr = from.value > 0 && latest.value > 0 && years > 0 ? (Math.pow(latest.value / from.value, 1 / years) - 1) * 100 : null;
    return { from, pct, cagr };
  };
  const recent = pts.filter((p) => p.year > latest.year - 10);
  return {
    latest, first, max, min, count: pts.length,
    five: change(back(5)), ten: change(back(10)), sinceFirst: change(first),
    avg10: recent.reduce((s, p) => s + p.value, 0) / recent.length, avg10From: recent[0].year,
    missing: latest.year - first.year + 1 - pts.length,
  };
}

const signed = (v, unit) => `${v > 0 ? 'up' : v < 0 ? 'down' : 'unchanged at'}${v === 0 ? '' : ` ${fmtNum(Math.abs(v))}${unit}`}`;

/** One sentence on how the latest value compares with an earlier one. */
export function changeSentence(ch, kind) {
  if (!ch) return null;
  if (kind === 'pct') {
    if (ch.points === 0) return `unchanged since ${ch.from.year}`;
    return `${signed(ch.points, ' percentage points')} from ${fmtValue(ch.from.value, kind)} in ${ch.from.year}`;
  }
  if (ch.pct == null) return null;
  const rate = ch.cagr != null && Math.abs(ch.cagr) >= 0.05 ? ` (${fmtNum(Math.abs(ch.cagr))}% a year on average, compounded)` : '';
  return `${signed(ch.pct, '%')} from ${fmtValue(ch.from.value, kind)} in ${ch.from.year}${rate}`;
}

/** Rank of a value among economies (not regional or income aggregates) reporting the same year; 1 = highest. */
export function rankAmong(entries, value) {
  const vals = entries.map((e) => e.value).filter((v) => Number.isFinite(v));
  return { rank: vals.filter((v) => v > value).length + 1, of: vals.length };
}

export const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};
