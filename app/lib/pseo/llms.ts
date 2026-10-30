// /llms.txt and /llms-full.txt: a plain-text map of the site for AI assistants and answer engines (llmstxt.org format).
// Built from the same data as the pages, so what an assistant reads is what a visitor sees.
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '../site';
import { GUIDES } from '../guides.mjs';
import { METRICS, METRIC_CATEGORIES } from './metrics.mjs';
import { METHODS, METHOD_CATEGORIES, TOOLS, methodTools, methodValueText, metricTitle, summary } from './pages.mjs';
import { excel } from './expr.mjs';
import { INDICATORS, WDI_PAGES } from '../wdi/wdi';
import { TOOLS as DEV_TOOLS } from '../tools/tools.mjs';
import { PAIRS } from '../convert/units.mjs';
import { CHAR_COUNT, UNICODE_VERSION } from '../unicode/unicode';
import { FAQS } from '../homeFaqs';

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
    '## Key facts',
    '- Category: AI data analysis software (business application), with general research, writing and coding help',
    '- How answers are made: figures are computed in code; the source, query and working are shown with each answer',
    '- Platforms: web app, desktop app (macOS, Windows, Linux) and a command-line tool',
    '- Pricing: Free plan, plus Premium and VIP billed through Razorpay in local currency; five runs without an account',
    '- Data access: connectors are read-only; private business data is not used to train public models',
    '- Built in India',
    '',
    '## Product',
    `- [Home](${SITE_URL}/): what AnalyzeIt does`,
    `- [Try it](${SITE_URL}/try): five free runs, no account`,
    `- [Live demo](${SITE_URL}/demo): try it without an account`,
    `- [Features](${SITE_URL}/features)`,
    `- [Pricing](${SITE_URL}/products): Free, Premium and VIP plans`,
    `- [Download](${SITE_URL}/download): desktop app and CLI`,
    `- [Security](${SITE_URL}/security): accounts, credentials and read-only access`,
    `- [About](${SITE_URL}/about): who runs AnalyzeIt`,
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
    '## Country data (World Bank, CC BY 4.0)',
    `- [Country data](${SITE_URL}/data): ${WDI_PAGES.toLocaleString('en-US')} pages, one per country and indicator, each with yearly history, chart, ranking and source`,
    `- [Indicators by topic](${SITE_URL}/indicators): ${INDICATORS.length.toLocaleString('en-US')} World Development Indicators, each ranked by country`,
    '',
    '## Tools and reference',
    `- [Tools](${SITE_URL}/tools): ${DEV_TOOLS.length} in-browser tools: ${DEV_TOOLS.map((t) => t.name).join('; ')}`,
    `- [Unicode lookup](${SITE_URL}/unicode): ${CHAR_COUNT.toLocaleString('en-US')} characters (Unicode ${UNICODE_VERSION}) with UTF-8, HTML, CSS, JavaScript and Python codes`,
    `- [Unit conversions](${SITE_URL}/convert): ${PAIRS.length} conversions with exact formulas`,
    '',
    '## Guides',
    ...GUIDES.map((g) => `- [${g.title}](${SITE_URL}/guides/${g.slug}): ${g.description}`),
    '',
    '## Sample data',
    `- [monthly.csv](${SITE_URL}/sample-data/monthly.csv): six months of a made-up subscription brand, used by every metric page`,
    `- [daily.csv](${SITE_URL}/sample-data/daily.csv): 30 made-up days of store orders, used by every method page`,
    '',
    '## Frequently asked questions',
    ...FAQS.flatMap((f) => [`### ${f.question}`, f.answer, '']),
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
