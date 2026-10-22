// One definition per metric, many outputs. A metric is an expression over the columns of the monthly table:
//   'revenue'                      a column (summed for the whole period, the row's own value per month)
//   100                            a constant
//   ['/', a, b] ['*', a, b] ['-', a, b] ['+', a, b]
// From that single tree we compute the worked figures and print the Excel, SQL and pandas code, so the numbers on a page and
// the code on a page cannot drift apart. scripts/seo/verify_snippets.py runs the printed code against the same rows.
import { DATASETS, colLetter } from './data.mjs';

const PREC = { '+': 1, '-': 1, '*': 2, '/': 2 };
const SYMBOL = { '+': '+', '-': '−', '*': '×', '/': '÷' };

export function columnsOf(node, acc = new Set()) {
  if (typeof node === 'string') acc.add(node);
  else if (Array.isArray(node)) { columnsOf(node[1], acc); columnsOf(node[2], acc); }
  return [...acc];
}

export function evaluate(node, leaf) {
  if (typeof node === 'number') return node;
  if (typeof node === 'string') return leaf(node);
  const [op, a, b] = node;
  const x = evaluate(a, leaf), y = evaluate(b, leaf);
  if (op === '+') return x + y;
  if (op === '-') return x - y;
  if (op === '*') return x * y;
  return y === 0 ? NaN : x / y;
}

/** Print a tree with only the brackets it needs. `leaf(col)` prints a column, `div(a, b)` lets SQL make division safe. */
function print(node, leaf, div, num = String) {
  const go = (n, parentPrec, parentOp, right) => {
    if (typeof n === 'number') return num(n);
    if (typeof n === 'string') return leaf(n);
    const [op, a, b] = n;
    const p = PREC[op];
    const s = op === '/' && div ? div(go(a, p, op, false), go(b, 0, null, false), go(b, p + 1, op, true)) : `${go(a, p, op, false)} ${op} ${go(b, p, op, true)}`;
    const wrap = p < parentPrec || (right && p === parentPrec && (parentOp === '-' || parentOp === '/'));
    return wrap ? `(${s})` : s;
  };
  return go(node, 0, null, false);
}

const isSum = (node) => Array.isArray(node) && (node[0] === '+' || node[0] === '-');

export const sums = (rows, cols) => Object.fromEntries(cols.map((c) => [c, rows.reduce((t, r) => t + r[c], 0)]));

// ---------- formatting ----------

const inr0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const plain = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

export function fmt(v, unit) {
  if (v == null || Number.isNaN(v)) return '—';
  if (unit === 'pct') return `${v.toFixed(2)}%`;
  if (unit === 'inr') return Math.abs(v) >= 1000 ? `₹${inr0.format(Math.round(v))}` : `₹${inr2.format(v)}`;
  if (unit === 'x') return `${v.toFixed(2)}×`;
  if (unit === 'months') return `${v.toFixed(1)} months`;
  if (unit === 'count') return plain.format(v);
  if (unit === 'pvalue') return v < 0.001 ? v.toExponential(2) : v.toFixed(4);
  return v.toFixed(2);
}

export const round2 = (v) => Math.round(v * 100) / 100;

// ---------- results ----------

/** Whole-period value and per-month values for a metric, computed from the sample rows. */
export function results(metric) {
  const rows = DATASETS.monthly.rows;
  if (metric.kind === 'growth') {
    const c = metric.column;
    const perMonth = rows.map((r, i) => ({ month: r.month, value: i === 0 ? NaN : ((r[c] - rows[i - 1][c]) / rows[i - 1][c]) * 100 }));
    const first = rows[0][c], last = rows.at(-1)[c];
    return { overall: ((last - first) / first) * 100, perMonth, inputs: { first, last } };
  }
  if (metric.kind === 'cmgr') {
    const c = metric.column;
    const first = rows[0][c], last = rows.at(-1)[c], n = rows.length - 1;
    const perMonth = rows.map((r, i) => ({ month: r.month, value: i === 0 ? NaN : (Math.pow(r[c] / first, 1 / i) - 1) * 100 }));
    return { overall: (Math.pow(last / first, 1 / n) - 1) * 100, perMonth, inputs: { first, last, n } };
  }
  const cols = columnsOf(metric.expr);
  const totals = sums(rows, cols);
  const scale = metric.scale ?? 1;
  const overall = evaluate(metric.expr, (c) => totals[c]) * scale;
  const perMonth = rows.map((r) => ({ month: r.month, value: evaluate(metric.expr, (c) => r[c]) * scale }));
  return { overall, perMonth, inputs: totals };
}

/** The worked arithmetic, with the six-month totals put into the formula. */
export function workedLine(metric) {
  const res = results(metric);
  const unitOf = (c) => DATASETS.monthly.columns.find((x) => x.key === c).unit;
  if (metric.kind === 'growth') return `(${fmt(res.inputs.last, unitOf(metric.column))} − ${fmt(res.inputs.first, unitOf(metric.column))}) ÷ ${fmt(res.inputs.first, unitOf(metric.column))} × 100 = ${fmt(res.overall, 'pct')}`;
  if (metric.kind === 'cmgr') return `(${fmt(res.inputs.last, unitOf(metric.column))} ÷ ${fmt(res.inputs.first, unitOf(metric.column))})^(1 ÷ ${res.inputs.n}) − 1 = ${fmt(res.overall, 'pct')}`;
  const body = print(metric.expr, (c) => fmt(res.inputs[c], unitOf(c)), null, (n) => plain.format(n)).replace(/ ([-+*/]) /g, (_, o) => ` ${SYMBOL[o]} `);
  const scaled = metric.scale && metric.scale !== 1 ? (isSum(metric.expr) ? `(${body}) × ${plain.format(metric.scale)}` : `${body} × ${plain.format(metric.scale)}`) : body;
  return `${scaled} = ${fmt(res.overall, metric.unit)}`;
}

// ---------- code ----------

const N = () => DATASETS.monthly.rows.length;
const range = (c) => `${colLetter('monthly', c)}2:${colLetter('monthly', c)}${N() + 1}`;
const cell = (c) => `${colLetter('monthly', c)}2`;

/** Excel percentages are left as fractions and formatted as %, which is how spreadsheets expect them. */
const excelScale = (m) => (m.unit === 'pct' ? (m.scale ?? 1) / 100 : (m.scale ?? 1));

export function excel(metric) {
  const out = DATASETS.monthly.rows.length + 1;
  if (metric.kind === 'growth') {
    const c = colLetter('monthly', metric.column);
    return { overall: `=(${c}${out}-${c}2)/${c}2`, perMonth: `=(${c}3-${c}2)/${c}2`, perMonthStartRow: 3, safe: `=IFERROR((${c}3-${c}2)/${c}2,"")` };
  }
  if (metric.kind === 'cmgr') {
    const c = colLetter('monthly', metric.column);
    return { overall: `=(${c}${out}/${c}2)^(1/(ROWS(${c}2:${c}${out})-1))-1`, perMonth: `=(${c}3/${c}$2)^(1/(ROW()-2))-1`, perMonthStartRow: 3, safe: `=IFERROR((${c}3/${c}$2)^(1/(ROW()-2))-1,"")` };
  }
  const k = excelScale(metric);
  const wrap = (s) => (k === 1 ? s : `(${s})*${k}`);
  const overall = `=${wrap(print(metric.expr, (c) => `SUM(${range(c)})`))}`;
  const perMonth = `=${wrap(print(metric.expr, cell))}`;
  return { overall, perMonth, perMonthStartRow: 2, safe: `=IFERROR(${perMonth.slice(1)},"")` };
}

const sqlNum = (n) => (Number.isInteger(n) ? `${n}.0` : String(n));
const sqlDiv = (safe) => (a, bare, wrapped) => `1.0 * ${a} / ${safe ? `NULLIF(${bare}, 0)` : wrapped}`;

export function sql(metric) {
  const name = metric.column_name;
  if (metric.kind === 'growth') {
    const c = metric.column;
    return {
      perMonth: `SELECT\n  month,\n  ${c},\n  ROUND(100.0 * (${c} - LAG(${c}) OVER (ORDER BY month))\n        / NULLIF(LAG(${c}) OVER (ORDER BY month), 0), 2) AS ${name}\nFROM monthly\nORDER BY month;`,
      overall: `SELECT ROUND(100.0 * (\n  (SELECT ${c} FROM monthly ORDER BY month DESC LIMIT 1) -\n  (SELECT ${c} FROM monthly ORDER BY month LIMIT 1)\n) / (SELECT ${c} FROM monthly ORDER BY month LIMIT 1), 2) AS ${name};`,
    };
  }
  if (metric.kind === 'cmgr') {
    const c = metric.column;
    return {
      perMonth: null,
      overall: `WITH ends AS (\n  SELECT\n    (SELECT ${c} FROM monthly ORDER BY month LIMIT 1)      AS first_value,\n    (SELECT ${c} FROM monthly ORDER BY month DESC LIMIT 1) AS last_value,\n    (SELECT COUNT(*) - 1 FROM monthly)                     AS steps\n)\nSELECT ROUND(100.0 * (POWER(1.0 * last_value / first_value, 1.0 / steps) - 1), 2) AS ${name}\nFROM ends;`,
    };
  }
  const k = metric.scale ?? 1;
  const pre = k === 1 ? '' : `${sqlNum(k)} * `;
  const body = (leaf, safe) => {
    const s = print(metric.expr, leaf, sqlDiv(safe));
    const out = k !== 1 && isSum(metric.expr) ? `${pre}(${s})` : `${pre}${s}`;
    // 1.0 * makes integer columns divide as decimals; once the expression starts with a decimal the repeats add nothing.
    return out.replace(/^(?:1\.0 \* )+/, '1.0 * ').replace(/^(\d+\.0) \* (?:1\.0 \* )+/, '$1 * ');
  };
  return {
    overall: `SELECT ROUND(${body((c) => `SUM(${c})`, true)}, 2) AS ${name}\nFROM monthly;`,
    perMonth: `SELECT\n  month,\n  ROUND(${body((c) => c, true)}, 2) AS ${name}\nFROM monthly\nORDER BY month;`,
    plain: body((c) => `SUM(${c})`, false),
  };
}

export function pandas(metric) {
  const name = metric.column_name;
  const head = 'import pandas as pd\n\ndf = pd.read_csv("monthly.csv")\n';
  if (metric.kind === 'growth') {
    const c = metric.column;
    return `${head}\n# Month on month\ndf["${name}"] = df["${c}"].pct_change() * 100\nprint(df[["month", "${c}", "${name}"]].round(2))\n\n# First month to last month\nfirst, last = df["${c}"].iloc[0], df["${c}"].iloc[-1]\n${name}_total = (last - first) / first * 100\nprint(round(${name}_total, 2))\n`;
  }
  if (metric.kind === 'cmgr') {
    const c = metric.column;
    return `${head}\nfirst, last = df["${c}"].iloc[0], df["${c}"].iloc[-1]\nsteps = len(df) - 1          # six months is five steps of growth\n${name} = ((last / first) ** (1 / steps) - 1) * 100\nprint(round(${name}, 2))\n`;
  }
  const k = metric.scale ?? 1;
  const tail = k === 1 ? '' : ` * ${k}`;
  const wrapIf = (s) => (k !== 1 && isSum(metric.expr) ? `(${s})` : s);
  const per = wrapIf(print(metric.expr, (c) => `df["${c}"]`)) + tail;
  const tot = wrapIf(print(metric.expr, (c) => `df["${c}"].sum()`)) + tail;
  return `${head}\n# Each month\ndf["${name}"] = ${per}\nprint(df[["month", "${name}"]].round(2))\n\n# Whole period: add up the parts first, then divide\n${name}_total = ${tot}\nprint(round(${name}_total, 2))\n`;
}
