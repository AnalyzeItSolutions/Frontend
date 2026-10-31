// What the page can say about a series beyond its latest value, all computed from the yearly points: how unusual the latest
// move is against the series' own history, the biggest moves on record, the straight-line trend of the last ten years and,
// only when it beat "no change" in a backtest, a three-year straight-line projection with its typical error.
// Pure functions on [{ year, value }] (oldest first, nulls allowed). No causes are claimed: the numbers say how big a move was
// and when, not why.
import { fmtNum, fmtValue } from './describe.mjs';

const clean = (points) => points.filter((p) => p.value != null && Number.isFinite(p.value));
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs) => { const m = mean(xs); return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1)); };

/** Straight-line fit of value on year. */
export function fitLine(pts) {
  const xs = pts.map((p) => p.year), ys = pts.map((p) => p.value);
  const mx = mean(xs), my = mean(ys);
  const sxx = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
  if (sxx === 0) return null;
  const slope = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / sxx;
  const intercept = my - slope * mx;
  const ssTot = ys.reduce((a, y) => a + (y - my) ** 2, 0);
  const ssRes = ys.reduce((a, y, i) => a + (y - (intercept + slope * xs[i])) ** 2, 0);
  return { slope, intercept, r2: ssTot === 0 ? 0 : 1 - ssRes / ssTot, at: (year) => intercept + slope * year };
}

/**
 * Year-on-year changes between consecutive years. Rates and shares change in percentage points; levels change in percent
 * when every value is positive (so a country's population and its GDP are comparable), otherwise in the unit itself.
 */
// Indicators measured in years, days, an index or "per" something change in their own unit: "0.2% more years of life" reads wrongly.
const OWN_UNIT = /\((?:years|days|months)\)|\bindex\b|\bper\b|\bratio\b|\bscore\b|\brating\b/i;

export function yearlyChanges(points, kind, name = '') {
  const pts = clean(points);
  const percent = kind !== 'pct' && !OWN_UNIT.test(name) && pts.every((p) => p.value > 0);
  const out = [];
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].year !== pts[i - 1].year + 1) continue; // a gap is not a yearly change
    out.push({ year: pts[i].year, from: pts[i - 1].value, to: pts[i].value, change: percent ? (pts[i].value / pts[i - 1].value - 1) * 100 : pts[i].value - pts[i - 1].value });
  }
  return { changes: out, unit: percent ? 'percent' : kind === 'pct' ? 'points' : 'units' };
}

export const MIN_HISTORY = 8; // earlier yearly changes needed before the latest one is judged against them

/** How unusual the latest yearly change is, compared with the changes before it. */
export function latestMove(points, kind, name = '') {
  const { changes, unit } = yearlyChanges(points, kind, name);
  const pts = clean(points);
  const latest = pts[pts.length - 1];
  const last = changes[changes.length - 1];
  if (!last || last.year !== latest?.year) return null;
  const prior = changes.slice(0, -1).slice(-30);
  if (prior.length < MIN_HISTORY) return null;
  const m = mean(prior.map((c) => c.change)), s = sd(prior.map((c) => c.change));
  if (!(s > 0)) return null;
  const z = (last.change - m) / s;
  const size = Math.abs(z) < 1 ? 'ordinary' : Math.abs(z) < 2 ? 'larger' : 'unusual';
  return { ...last, unit, mean: m, sd: s, z, size, n: prior.length, firstYear: changes[changes.length - 1 - prior.length].year };
}

/** The biggest rise and the biggest fall on record. */
export function biggestMoves(points, kind, name = '') {
  const { changes, unit } = yearlyChanges(points, kind, name);
  if (changes.length < MIN_HISTORY) return null;
  const rise = changes.reduce((a, b) => (b.change > a.change ? b : a));
  const fall = changes.reduce((a, b) => (b.change < a.change ? b : a));
  return { unit, rise: rise.change > 0 ? rise : null, fall: fall.change < 0 ? fall : null };
}

/** Straight-line trend over the last ten years (at least eight observed). */
export function recentTrend(points) {
  const pts = clean(points);
  const latest = pts[pts.length - 1];
  const win = pts.filter((p) => p.year > latest.year - 10);
  if (win.length < 8) return null;
  const fit = fitLine(win);
  if (!fit) return null;
  const direction = fit.r2 < 0.3 ? 'flat' : fit.slope > 0 ? 'up' : 'down';
  return { from: win[0].year, to: latest.year, n: win.length, slope: fit.slope, r2: fit.r2, direction };
}

const WINDOW = 12; // years of history a projection is fitted on
const HORIZON = 3; // years ahead
const HOLDOUT = 3; // most recent observations kept back to test it

/**
 * A straight-line projection three years past the latest value, offered only when the same method, fitted on the history
 * before the last three observations, predicted those three better than "no change" would have (and the recent fit is tight).
 * The error shown is that backtest's mean absolute error, not a confidence interval.
 */
export function projection(points) {
  const pts = clean(points);
  if (pts.length < 15) return null;
  const latest = pts[pts.length - 1];
  const full = pts.filter((p) => p.year > latest.year - WINDOW);
  if (full.length < 10) return null;
  const fit = fitLine(full);
  if (!fit || fit.r2 < 0.8) return null;
  const test = pts.slice(-HOLDOUT);
  const train = pts.slice(0, -HOLDOUT).filter((p) => p.year > test[0].year - WINDOW);
  if (train.length < 10) return null;
  const tfit = fitLine(train);
  if (!tfit) return null;
  const lastTrain = train[train.length - 1].value;
  const modelErr = mean(test.map((p) => Math.abs(tfit.at(p.year) - p.value)));
  const naiveErr = mean(test.map((p) => Math.abs(lastTrain - p.value)));
  if (!(modelErr < naiveErr * 0.8)) return null;
  const year = latest.year + HORIZON;
  return { year, value: fit.at(year), error: modelErr, naiveError: naiveErr, r2: fit.r2, from: full[0].year, testFrom: test[0].year, testTo: latest.year };
}

const fmtChange = (v, unit, kind) => (unit === 'percent' ? `${Math.abs(v).toLocaleString('en-US', { maximumFractionDigits: 1 })}%` : unit === 'points' ? `${Math.abs(v).toLocaleString('en-US', { maximumFractionDigits: 2 })} percentage points` : fmtValue(Math.abs(v), kind));
const poss = (n) => (/s$/i.test(n) ? `${n}'` : `${n}'s`);
const pctOf = (r2) => (r2 < 0.005 ? 'less than 1%' : `${Math.round(r2 * 100)}%`);
const dir = (v) => (v > 0 ? 'rose' : v < 0 ? 'fell' : 'did not change');

/**
 * The paragraphs for the page. `name` is the lower-cased indicator, `kind` from kindOf. Returns { moves, trend, projection }
 * as arrays of plain sentences (empty when the series is too short or the checks above say not to claim anything).
 */
export function analysisText({ country, name, kind, points }) {
  const out = { move: [], biggest: [], trend: [], projection: [] };
  const lm = latestMove(points, kind, name);
  if (lm) {
    const verdict = { ordinary: 'an ordinary year: it sits within the range of normal year-to-year movement', larger: 'larger than a typical year, though not out of the range seen before', unusual: 'unusually large compared with the rest of the record' }[lm.size];
    out.move.push(`In ${lm.year}, ${poss(country)} ${name} ${dir(lm.change)} ${fmtChange(lm.change, lm.unit, kind)} on ${lm.year - 1} (from ${fmtValue(lm.from, kind)} to ${fmtValue(lm.to, kind)}).`);
    out.move.push(`Across the ${lm.n} yearly changes before that (${lm.firstYear} to ${lm.year - 1}), the average change was ${lm.mean >= 0 ? '+' : '−'}${fmtChange(lm.mean, lm.unit, kind)} and a typical year strayed about ${fmtChange(lm.sd, lm.unit, kind)} from that (the standard deviation). This year's change was ${Math.abs(lm.z).toFixed(1)} standard deviations ${lm.z >= 0 ? 'above' : 'below'} that average, so it was ${verdict}.`);
  }
  const bm = biggestMoves(points, kind, name);
  if (bm && (bm.rise || bm.fall)) {
    const parts = [];
    if (bm.rise) parts.push(`the biggest yearly rise was ${fmtChange(bm.rise.change, bm.unit, kind)} in ${bm.rise.year}`);
    if (bm.fall) parts.push(`the biggest yearly fall was ${fmtChange(bm.fall.change, bm.unit, kind)} in ${bm.fall.year}`);
    out.biggest.push(`On record, ${parts.join(' and ')}. The numbers show how large and when, not why; for the cause, look at what happened in that country in those years.`);
  }
  const tr = recentTrend(points);
  if (tr) {
    const perYear = tr.direction === 'flat' ? null : kind === 'pct' ? `${fmtNum(Math.abs(tr.slope))} percentage points a year` : `${fmtValue(Math.abs(tr.slope), kind)} a year`;
    out.trend.push(
      tr.direction === 'flat'
        ? `From ${tr.from} to ${tr.to} there is no clear straight-line trend: a straight line explains ${pctOf(tr.r2)} of the movement over ${tr.n} observed years, so the value is moving around more than it is heading anywhere.`
        : `From ${tr.from} to ${tr.to} the straight-line trend is ${tr.direction === 'up' ? 'upward' : 'downward'}, about ${perYear}. A straight line explains ${pctOf(tr.r2)} of the movement over ${tr.n} observed years.`,
    );
  }
  const pj = projection(points);
  if (pj) {
    out.projection.push(`Extending that straight line gives about ${fmtValue(pj.value, kind)} for ${pj.year}. We show this only because the same method, fitted on earlier years, predicted ${pj.testFrom} to ${pj.testTo} better than "no change" would have: its average miss was ${fmtValue(pj.error, kind)}, against ${fmtValue(pj.naiveError, kind)} for assuming no change. Treat it as a continuation of the recent pattern, not a forecast of events: it cannot see a recession, a policy change or a revision to the data.`);
  }
  return out;
}
