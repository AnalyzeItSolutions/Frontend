// Writes every generated code snippet and the figure each page claims for it, for verify_snippets.py to run.
// Usage: node scripts/seo/export_snippets.mjs <out-dir>   (writes snippets.json plus the sample CSVs)
import fs from 'node:fs';
import path from 'node:path';
import { DATASETS, toCsv } from '../../app/lib/pseo/data.mjs';
import { METRICS } from '../../app/lib/pseo/metrics.mjs';
import { excel, pandas, results, sql } from '../../app/lib/pseo/expr.mjs';
import { METHODS, methodResults } from '../../app/lib/pseo/methods.mjs';

const out = process.argv[2] || '.';
fs.mkdirSync(out, { recursive: true });
for (const name of Object.keys(DATASETS)) fs.writeFileSync(path.join(out, `${name}.csv`), toCsv(name));

const items = [];
for (const m of METRICS) {
  const r = results(m);
  const excelScale = m.unit === 'pct' ? 100 : 1; // spreadsheets return fractions for percentages
  const x = excel(m), q = sql(m);
  items.push({
    id: m.slug, dataset: 'monthly', expected: r.overall, perMonth: r.perMonth.map((p) => (Number.isFinite(p.value) ? p.value : null)),
    excel: { overall: x.overall, perMonth: x.perMonth, perMonthStartRow: x.perMonthStartRow, scale: excelScale },
    sql: { overall: q.overall, perMonth: q.perMonth },
    pandas: { code: pandas(m), total: m.kind === 'cmgr' ? m.column_name : `${m.column_name}_total`, column: m.kind === 'cmgr' ? null : m.column_name },
  });
}
for (const m of METHODS) {
  const r = methodResults(m);
  items.push({
    id: `method:${m.slug}`, dataset: 'daily', expected: r.value, tolerance: m.tolerance ?? 0.01, relative: m.unit === 'pvalue',
    excel: m.excel ? { overall: m.excel, scale: m.excelScale ?? 1 } : null,
    sql: m.sql ? { overall: m.sql, engines: m.sqlEngines ?? ['sqlite', 'duckdb'] } : null,
    pandas: m.pandas ? { code: m.pandas, total: m.pandasVar } : null,
  });
}
fs.writeFileSync(path.join(out, 'snippets.json'), JSON.stringify(items, null, 1));
console.log(`${items.length} items written to ${out}`);
