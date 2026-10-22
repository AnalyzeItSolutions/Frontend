// Small statistics library for the /methods pages. Each function matches the spreadsheet function named beside it, so the
// figure on a page is the figure Excel, pandas and DuckDB return (scripts/seo/verify_snippets.py checks that they do).

export const sum = (xs) => xs.reduce((a, b) => a + b, 0);
export const mean = (xs) => sum(xs) / xs.length;                                   // AVERAGE
export const variance = (xs) => { const m = mean(xs); return sum(xs.map((x) => (x - m) ** 2)) / (xs.length - 1); }; // VAR.S
export const sd = (xs) => Math.sqrt(variance(xs));                                 // STDEV.S

/** Linear interpolation between closest ranks: PERCENTILE.INC, QUARTILE.INC, pandas quantile(), PERCENTILE_CONT. */
export function quantile(xs, p) {
  const s = [...xs].sort((a, b) => a - b);
  const h = (s.length - 1) * p;
  const lo = Math.floor(h);
  return s[lo] + (h - lo) * ((s[lo + 1] ?? s[lo]) - s[lo]);
}
export const median = (xs) => quantile(xs, 0.5);                                   // MEDIAN

export function skew(xs) {                                                         // SKEW (adjusted Fisher–Pearson)
  const n = xs.length, m = mean(xs), s = sd(xs);
  return (n / ((n - 1) * (n - 2))) * sum(xs.map((x) => ((x - m) / s) ** 3));
}
export function kurt(xs) {                                                         // KURT (excess, sample-adjusted)
  const n = xs.length, m = mean(xs), s = sd(xs);
  const a = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3));
  const b = (3 * (n - 1) ** 2) / ((n - 2) * (n - 3));
  return a * sum(xs.map((x) => ((x - m) / s) ** 4)) - b;
}
export function correl(xs, ys) {                                                   // CORREL
  const mx = mean(xs), my = mean(ys);
  const sxy = sum(xs.map((x, i) => (x - mx) * (ys[i] - my)));
  return sxy / Math.sqrt(sum(xs.map((x) => (x - mx) ** 2)) * sum(ys.map((y) => (y - my) ** 2)));
}
export function slope(ys, xs) {                                                    // SLOPE(known_y, known_x)
  const mx = mean(xs), my = mean(ys);
  return sum(xs.map((x, i) => (x - mx) * (ys[i] - my))) / sum(xs.map((x) => (x - mx) ** 2));
}
export const intercept = (ys, xs) => mean(ys) - slope(ys, xs) * mean(xs);          // INTERCEPT
export const rsq = (ys, xs) => correl(xs, ys) ** 2;                                // RSQ

// ---- t distribution, via the regularised incomplete beta function (Numerical Recipes, ch. 6) ----
function lgamma(z) {
  const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let x = z, y = z, t = x + 5.5;
  t -= (x + 0.5) * Math.log(t);
  let ser = 1.000000000190015;
  for (const c of g) ser += c / ++y;
  return -t + Math.log((2.5066282746310005 * ser) / x);
}
function betacf(a, b, x) {
  let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < 1e-300) d = 1e-300;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300;
    c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300;
    d = 1 / d; h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300;
    c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 3e-14) break;
  }
  return h;
}
function betai(a, b, x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}
/** Two-tailed p-value for a t statistic with df degrees of freedom (df may be fractional, as in Welch's test). */
export const tTwoTailed = (t, df) => betai(df / 2, 0.5, df / (df + t * t));
/** The t value with probability p in the upper tail (T.INV(1 - p, df)), found by bisection. */
export function tUpper(p, df) {
  let lo = 0, hi = 1000;
  for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (tTwoTailed(mid, df) / 2 > p) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}
export function welch(xs, ys) {                                                    // T.TEST(x, y, 2, 3)
  const vx = variance(xs) / xs.length, vy = variance(ys) / ys.length;
  const t = (mean(xs) - mean(ys)) / Math.sqrt(vx + vy);
  const df = (vx + vy) ** 2 / (vx ** 2 / (xs.length - 1) + vy ** 2 / (ys.length - 1));
  return { t, df, p: tTwoTailed(t, df) };
}
