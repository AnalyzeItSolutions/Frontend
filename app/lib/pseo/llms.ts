// /llms.txt and /llms-full.txt: a plain-text map of the site for AI assistants and answer engines (llmstxt.org format).
// Built from the same data as the pages, so what an assistant reads is what a visitor sees.
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '../site';
import { GUIDES } from '../guides.mjs';
import { METRICS, METRIC_CATEGORIES } from './metrics.mjs';
import { METHODS, METHOD_CATEGORIES, TOOLS, methodTools, methodValueText, metricTitle, summary } from './pages.mjs';
import { excel } from './expr.mjs';

const DOCS: [string, string, string][] = [
  ['/docs/how-answers-work', 'How AnalyzeIt answers', 'Which tools and models produce an answer, and how figures are computed by code rather than guessed.'],
  ['/docs/discovery', 'Discovery and forecasts', 'How AnalyzeIt finds what changed in a dataset, labels evidence strength, and forecasts.'],
  ['/docs/connectors', 'Connectors', 'What data sources can be connected.'],
  ['/docs/plans', 'Plans', 'What each plan includes.'],
  ['/docs/memory', 'Memory', 'What AnalyzeIt remembers and how it is used.'],
  ['/docs/connect-assistant', 'Connect an AI assistant', 'Use AnalyzeIt from Claude and other assistants.'],
];

export function llmsTxt() {
  const lines = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    'AnalyzeIt is an analytics assistant for small online and direct-to-consumer brands: ask questions about your sales, payments and customers in plain words and get answers computed by code, with the working shown. The reference pages below define business metrics and statistics methods, each with a worked example on downloadable sample data and Excel, SQL and Python code that is tested against that data.',
    '',
    '## Product',
    `- [Home](${SITE_URL}/): what AnalyzeIt does`,
    `- [Live demo](${SITE_URL}/demo): try it without an account`,
    `- [Features](${SITE_URL}/features)`,
    ...DOCS.map(([p, t, d]) => `- [${t}](${SITE_URL}${p}): ${d}`),
    '',
    '## Business metrics',
    `- [All metrics](${SITE_URL}/metrics): ${METRICS.length} metrics with formulas, worked examples and calculators`,
    ...METRIC_CATEGORIES.flatMap((c) => METRICS.filter((m) => m.category === c.slug).map((m) => `- [${metricTitle(m)}](${SITE_URL}/metrics/${m.slug}): ${m.formula}`)),
    '',
    '## Statistics methods',
    `- [All methods](${SITE_URL}/methods): ${METHODS.length} methods worked on one 30-day dataset`,
    ...METHOD_CATEGORIES.flatMap((c) => METHODS.filter((m) => m.category === c.slug).map((m) => `- [${m.name}](${SITE_URL}/methods/${m.slug}): ${m.formula}`)),
    '',
    '## Guides',
    ...GUIDES.map((g) => `- [${g.title}](${SITE_URL}/guides/${g.slug}): ${g.description}`),
    '',
    '## Sample data',
    `- [monthly.csv](${SITE_URL}/sample-data/monthly.csv): six months of a made-up subscription brand, used by every metric page`,
    `- [daily.csv](${SITE_URL}/sample-data/daily.csv): 30 made-up days of store orders, used by every method page`,
    '',
    '## Optional',
    `- [Full text of the metric and method pages](${SITE_URL}/llms-full.txt)`,
    `- [Changelog](${SITE_URL}/changelog)`,
    '',
  ];
  return lines.join('\n');
}

export function llmsFullTxt() {
  const out = [`# ${SITE_NAME}: business metrics and statistics methods`, '', `> Every figure below is computed from made-up sample data published at ${SITE_URL}/sample-data/. Code is tested against that data.`, ''];
  for (const m of METRICS) {
    const s = summary(m);
    out.push(
      `## ${metricTitle(m)}`, `Source: ${SITE_URL}/metrics/${m.slug}`, '',
      m.answer, '', `Formula: ${m.formula}`, '', `Worked example (sample data, six months): ${s.worked}`, '',
      m.why, '', m.read, '', 'Common mistakes:', ...m.pitfalls.map((p) => `- ${p}`), '',
      `Excel / Google Sheets: ${excel(m).overall}`,
      ...TOOLS.filter((t) => t.slug !== 'excel').map((t) => `${t.name}: ${SITE_URL}/metrics/${m.slug}/${t.slug}`),
      '',
    );
  }
  for (const m of METHODS) {
    out.push(
      `## ${m.name}`, `Source: ${SITE_URL}/methods/${m.slug}`, '',
      m.answer, '', `Formula: ${m.formula}`, '', `On the 30-day sample: ${methodValueText(m)}. ${m.read}`, '',
      m.why, '', 'Common mistakes:', ...m.pitfalls.map((p) => `- ${p}`), '',
      ...(m.excel ? [`Excel / Google Sheets: ${m.excel}`] : []),
      ...methodTools(m).filter((t) => t !== 'excel').map((t) => `${TOOLS.find((x) => x.slug === t)!.name}: ${SITE_URL}/methods/${m.slug}/${t}`),
      '',
    );
  }
  return out.join('\n');
}
