// What each /metrics page says, built from the metric definition plus the computed results. Kept apart from the React
// pages so tests, llms.txt and the snippet verifier read exactly the same text the pages render.
import { DATASETS, colLetter, letter } from './data.mjs';
import { METRICS, METRIC_CATEGORIES, metric } from './metrics.mjs';
import { columnsOf, excel, fmt, pandas, results, sql, workedLine } from './expr.mjs';
import { METHODS, METHOD_CATEGORIES, method, methodResults, methodTools } from './methods.mjs';

export const TOOLS = [
  { slug: 'excel', name: 'Excel and Google Sheets', short: 'Excel' },
  { slug: 'sql', name: 'SQL', short: 'SQL' },
  { slug: 'python', name: 'Python (pandas)', short: 'Python' },
];
export const tool = (slug) => TOOLS.find((t) => t.slug === slug);

export const metricTitle = (m) => (m.abbr ? `${m.name} (${m.abbr})` : m.name);

export function metricColumns(m) {
  const cols = m.kind ? [m.column] : columnsOf(m.expr);
  return DATASETS.monthly.columns.filter((c) => cols.includes(c.key));
}

export function summary(m) {
  const r = results(m);
  return { ...r, overallText: fmt(r.overall, m.unit), worked: workedLine(m) };
}

// Lower-case the first letter for use mid-sentence, but leave acronyms (RTO, MRR, COGS) alone.
export const lower = (s) => (/^[A-Z][A-Z]/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));

export function metricMeta(m) {
  const s = summary(m);
  const title = `${metricTitle(m)}: formula, example and calculator`;
  const first = m.answer.split('. ')[0].replace(/\.$/, '');
  const description = first.length <= 118
    ? `${first}. Formula, worked example and calculator.`
    : `How to calculate ${lower(m.name)}: the formula, a worked example on sample data, a free calculator and the usual mistakes.`;
  return { title, description, overall: s.overallText };
}

export function toolMeta(m, t) {
  const title = `How to calculate ${lower(m.name)} in ${t.name}`;
  const description = {
    excel: `The ${m.abbr || lower(m.name)} formula for Excel and Google Sheets, for one month and a whole period, with sample data to download and the answer to check against.`,
    sql: `A SQL query for ${m.abbr || lower(m.name)}, by month and for a whole period, safe against division by zero, with sample data and the expected output.`,
    python: `Calculate ${m.abbr || lower(m.name)} in Python with pandas, by month and for a whole period, with a sample CSV and the output to check against.`,
  }[t.slug];
  return { title, description: description.slice(0, 158) };
}

export function metricFaq(m) {
  const s = summary(m);
  const x = excel(m);
  return [
    { q: `What is ${lower(m.name)}?`, a: m.answer },
    { q: `How do you calculate ${lower(m.name)}?`, a: `${m.formula}. For example, with six months of sample data: ${s.worked}.` },
    { q: `What is the ${m.abbr || lower(m.name)} formula in Excel?`, a: `With the sample data laid out as in the downloadable CSV, ${x.overall} gives the figure for the whole period${m.unit === 'pct' ? ' (format the cell as a percentage)' : ''}. For one month, use ${x.perMonth} and fill it down.` },
    { q: `What is a good ${lower(m.name)}?`, a: `There is no figure that is right for every business: it depends on your products, prices and channels. ${m.read}` },
  ];
}

/** Step-by-step instructions for one tool, written from the metric's own columns and code. */
export function toolGuide(m, t) {
  const cols = metricColumns(m);
  const s = summary(m);
  const nextCol = letter(DATASETS.monthly.columns.length + 1); // first empty column to the right of the data
  if (t.slug === 'excel') {
    const x = excel(m);
    return {
      answer: `In Excel or Google Sheets, ${lower(m.name)} for a whole period is ${x.overall.slice(1)}, where each SUM covers one column of monthly figures. On the sample data it returns ${s.overallText}.`,
      layout: cols.map((c) => `${c.label}: column ${colLetter('monthly', c.key)} (${c.key})`),
      steps: [
        'Download monthly.csv below and open it: in Excel use File → Open; in Google Sheets use File → Import → Upload. The headers land in row 1 and the six months in rows 2 to 7.',
        `Click any empty cell and enter ${x.overall} for the whole six months. It adds up each column first and then does the arithmetic once, which is the correct way to combine months.`,
        `For each month, click ${nextCol}${x.perMonthStartRow}, enter ${x.perMonth} and drag the fill handle down to row 7.`,
        m.unit === 'pct'
          ? 'Format the results as a percentage (Home → %, or Format → Number → Percent in Sheets). The formula returns a fraction such as 0.45, which the format shows as 45%.'
          : m.unit === 'inr' ? 'Format the results as currency with two decimals.' : 'Format the results as a number with two decimals.',
        `If a month can have zero in the denominator, wrap the formula so it shows a blank instead of #DIV/0!: ${x.safe}.`,
      ],
      code: [
        { label: 'Whole period', code: x.overall },
        { label: `Each month (in ${nextCol}${x.perMonthStartRow}, fill down)`, code: x.perMonth },
      ],
      notes: [
        'Google Sheets accepts the same formulas. If your spreadsheet locale uses a comma as the decimal separator, Sheets and Excel expect semicolons between function arguments instead of commas.',
        'Averaging the monthly results with AVERAGE() gives a different and usually wrong answer for the period, because every month counts the same however large it was.',
        'Excel tables (Insert → Table) let you write the same formula with column names instead of letters, which is easier to read and survives inserted columns.',
      ],
    };
  }
  if (t.slug === 'sql') {
    const q = sql(m);
    const schema = `CREATE TABLE monthly (\n  month TEXT,          -- 'YYYY-MM'\n${cols.map((c) => `  ${c.key} INTEGER`).join(',\n')}\n);`;
    return {
      answer: `In SQL, ${lower(m.name)} for the whole period is ${q.plain ? `ROUND(${q.plain}, 2)` : 'calculated from the first and last month'} over the monthly table. On the sample data it returns ${s.overallText.replace(/[₹%×]| months/g, '').trim()}.`,
      layout: cols.map((c) => `${c.key}: ${lower(c.label)}`),
      steps: [
        'Load monthly.csv into a table called monthly. The table only needs the month column and the columns below.',
        q.perMonth ? 'Run the first query to get one row per month.' : 'This metric summarises the whole period, so it is a single query.',
        'Run the whole-period query. It adds up each column first and divides once; averaging the monthly results gives a different, usually wrong, answer.',
      ],
      schema,
      code: [q.perMonth ? { label: 'By month', code: q.perMonth } : null, { label: 'Whole period', code: q.overall }].filter(Boolean),
      notes: [
        'Integer columns divide as integers in PostgreSQL, SQLite and SQL Server, so 3 / 4 gives 0. Multiplying by 1.0 (or 100.0) first makes the division decimal.',
        'NULLIF(x, 0) turns a zero denominator into NULL, so the query returns NULL for that row instead of failing with a division-by-zero error.',
        'Tested on SQLite and DuckDB. SUM, NULLIF and ROUND work the same in PostgreSQL, MySQL and BigQuery; SQL Server uses TOP instead of LIMIT where a query has one.',
      ],
    };
  }
  const code = pandas(m);
  return {
    answer: `In Python, load the data with pandas and compute ${lower(m.name)} from column totals for the whole period, or row by row for each month. On the sample data it returns ${s.overallText.replace(/[₹%×]| months/g, '').trim()}.`,
    layout: cols.map((c) => `df["${c.key}"]: ${lower(c.label)}`),
    steps: [
      'Install pandas (pip install pandas) and save monthly.csv next to your script.',
      'Run the script. The first print shows one row per month, the second the figure for the whole period.',
      'To use your own data, rename your columns to match, or change the names in the code.',
    ],
    code: [{ label: 'Script', code }],
    notes: [
      'Dividing by zero in pandas does not raise an error: it gives inf or NaN. Check with df.replace([float("inf"), -float("inf")], float("nan")) before averaging or plotting.',
      'For the whole period, sum the columns first and then divide. df[col].mean() of the monthly results weights a small month the same as a large one.',
      'pct_change(), groupby() and resample() extend the same idea to weekly data, product categories and daily rows.',
    ],
  };
}

export function relatedMetrics(m) {
  return m.related.map(metric).filter(Boolean);
}

export function categoryName(slug) {
  return METRIC_CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}

export function allMetricPaths() {
  return METRICS.flatMap((m) => [`/metrics/${m.slug}`, ...TOOLS.map((t) => `/metrics/${m.slug}/${t.slug}`)]);
}

// ---------------- /methods ----------------

export const methodCategoryName = (slug) => METHOD_CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
export const methodValueText = (m) => fmt(methodResults(m).value, m.unit);
const shortName = (m) => m.name.replace(/ \(.*\)$/, '');

export function methodMeta(m) {
  const first = m.answer.split('. ')[0].replace(/\.$/, '');
  const title = `${m.name}: what it means and how to calculate it`;
  const description = first.length <= 112 ? `${first}. Formula, worked example and code.` : `${shortName(m)} explained in plain words, with the formula, a worked example on sample data, and Excel, SQL and Python code.`;
  return { title, description };
}

export function methodToolMeta(m, t) {
  const n = lower(shortName(m));
  const title = `How to calculate ${n} in ${t.name}`;
  const description = {
    excel: `Excel and Google Sheets formula for ${n}, worked on 30 days of downloadable sample data, with the answer to check against.`,
    sql: `SQL query for ${n}, run on a downloadable 30-day sample table, with the expected result and which databases support it.`,
    python: `Calculate ${n} in Python with pandas on a 30-day sample CSV, with the expected output and how it differs from Excel.`,
  }[t.slug];
  return { title, description };
}

export function methodToolGuide(m, t) {
  const v = methodValueText(m);
  const n = lower(shortName(m));
  if (t.slug === 'excel') {
    return {
      answer: `In Excel or Google Sheets, ${n} for the sample data is ${m.excel}${m.excelScale === 100 ? ' (format the cell as a percentage)' : ''}. It returns ${v}.`,
      steps: [
        'Download daily.csv below and open it in Excel (File → Open) or Google Sheets (File → Import). Columns: A day, B ad_spend, C website_orders, D app_orders, E avg_basket; data in rows 2 to 31.',
        `Click an empty cell and enter ${m.excel}.`,
        `Check the result against ${v}. If it differs, check that the ranges cover rows 2 to 31 and that no cell holds text instead of a number.`,
      ],
      code: [{ label: 'Formula', code: m.excel }],
      notes: [
        'Google Sheets supports the same function names. In locales that use a comma as the decimal separator, separate arguments with semicolons.',
        'Excel functions skip blank cells and text but include zeros. A missing day typed as 0 changes the answer; leave it blank if it is unknown.',
      ],
    };
  }
  if (t.slug === 'sql') {
    const duckOnly = m.sqlEngines && !m.sqlEngines.includes('sqlite');
    return {
      answer: `In SQL, ${n} over the sample table is calculated with the query below. On the sample data it returns ${v}.`,
      steps: [
        'Load daily.csv into a table called daily (day, ad_spend, website_orders, app_orders, avg_basket).',
        'Run the query and compare with the expected result.',
      ],
      schema: 'CREATE TABLE daily (\n  day INTEGER,\n  ad_spend INTEGER,\n  website_orders INTEGER,\n  app_orders INTEGER,\n  avg_basket INTEGER\n);',
      code: [{ label: 'Query', code: m.sql }],
      notes: [
        duckOnly
          ? 'Tested on DuckDB. The same functions exist in PostgreSQL. SQLite and MySQL lack most statistical aggregates; compute in Python or load the data into DuckDB, which can query a CSV file directly.'
          : 'Tested on SQLite and DuckDB; it uses only standard SQL, so it also runs on PostgreSQL, MySQL and BigQuery.',
        'Statistical aggregates ignore NULL rows. Decide whether a missing day should be NULL (left out) or 0 (counted as a zero day).',
      ],
    };
  }
  return {
    answer: `In Python with pandas, ${n} for the sample data takes a few lines, shown below. It returns ${v}.`,
    steps: [
      `Install the libraries (pip install pandas${/scipy/.test(m.pandas) ? ' scipy' : ''}${/numpy/.test(m.pandas) ? ' numpy' : ''}) and save daily.csv next to your script.`,
      'Run the script and compare the printed value with the expected result.',
    ],
    code: [{ label: 'Script', code: m.pandas }],
    notes: [
      'pandas methods such as .std(), .var() and .quantile() match Excel\'s sample versions (STDEV.S, VAR.S, PERCENTILE.INC). NumPy\'s np.std() and np.var() default to the population version instead.',
      'pandas skips NaN values in these calculations by default. Count how many rows were used if data might be missing.',
    ],
  };
}

export function methodFaq(m) {
  const v = methodValueText(m);
  return [
    { q: `What is ${lower(shortName(m))}?`, a: m.answer },
    { q: `What is the formula for ${lower(shortName(m))}?`, a: `${m.formula}. On the 30-day sample data the result is ${v}.` },
    ...(m.excel ? [{ q: `How do you calculate ${lower(shortName(m))} in Excel?`, a: `Use ${m.excel} with the data in rows 2 to 31. The same formula works in Google Sheets.` }] : []),
  ];
}

export const relatedMethods = (m) => m.related.map(method).filter(Boolean);

export function allMethodPaths() {
  return METHODS.flatMap((m) => [`/methods/${m.slug}`, ...methodTools(m).map((t) => `/methods/${m.slug}/${t}`)]);
}

export { METHODS, METHOD_CATEGORIES, method, methodResults, methodTools };
