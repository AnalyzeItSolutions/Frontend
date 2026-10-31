// Six longer guides, each answering a cluster of related searches ("how to do data analysis", "data analysis methods",
// "excel data analysis", "python for data analysis", "data analysis examples", "free online data analysis tools").
//
// Every figure is computed from the made-up 30-day sample behind /methods (data.mjs DAILY), never typed in, and every code
// block is one that scripts/seo/verify_snippets.py runs against that sample (the method snippets already are; the guide-only
// ones are listed in GUIDE_CHECKS below). Spreadsheet layout, as in daily.csv: A day, B ad_spend, C website_orders,
// D app_orders, E avg_basket, data in rows 2 to 31.
// Blocks: { p }, { h2 }, { ul }, { ol }, { code: { label, code } }, { table: { caption, head, rows } }, { faq: [{ q, a }] }.
import { DAILY } from './pseo/data.mjs';
import * as S from './pseo/stats.mjs';
import { method, methodResults } from './pseo/methods.mjs';

const web = DAILY.map((r) => r.website_orders);
const app = DAILY.map((r) => r.app_orders);
const orders = DAILY.map((r) => r.website_orders + r.app_orders);
const n = (v, d = 2) => Number(v).toLocaleString('en-US', { maximumFractionDigits: d });
const val = (slug) => methodResults(method(slug)).value;
const code = (label, text) => ({ code: { label, code: text.trim() } });
const PD = 'import pandas as pd\n\ndf = pd.read_csv("daily.csv")\n';

const total = S.sum(orders);
const webTotal = S.sum(web), appTotal = S.sum(app);
const appShare = (appTotal / total) * 100;
const week3Web = S.sum(web.slice(14, 21));
const revenueApp = DAILY.reduce((t, r) => t + r.app_orders * r.avg_basket, 0);
const q1 = S.quantile(web, 0.25), q3 = S.quantile(web, 0.75);
const upperFence = q3 + 1.5 * (q3 - q1);
const day17 = DAILY[16];
const meanWeb = S.mean(web), medianWeb = S.median(web), sdWeb = S.sd(web);
const r = val('correlation');
const perThousand = val('linear-regression');
const forecast31 = val('linear-trend-forecast');
const ma7 = val('moving-average');
const pWelch = val('t-test');
const z17 = val('z-score');

/** Snippets that exist only in these guides. verify_snippets.py runs them like the ones on /methods. */
export const GUIDE_CHECKS = [
  {
    id: 'guide:total-orders', dataset: 'daily', expected: total,
    excel: { overall: '=SUM(C2:D31)', scale: 1 },
    sql: { overall: 'SELECT SUM(website_orders + app_orders) AS total_orders\nFROM daily;' },
    pandas: { code: `${PD}\ndf["orders"] = df["website_orders"] + df["app_orders"]\ntotal_orders = df["orders"].sum()\nprint(total_orders)\n`, total: 'total_orders' },
  },
  {
    id: 'guide:app-share', dataset: 'daily', expected: appShare, tolerance: 0.01,
    excel: { overall: '=SUM(D2:D31)/SUM(C2:D31)*100', scale: 1 },
    sql: { overall: 'SELECT ROUND(100.0 * SUM(app_orders) / SUM(website_orders + app_orders), 2) AS app_share_pct\nFROM daily;' },
    pandas: { code: `${PD}\napp_share_pct = 100 * df["app_orders"].sum() / (df["website_orders"] + df["app_orders"]).sum()\nprint(round(app_share_pct, 2))\n`, total: 'app_share_pct' },
  },
  {
    id: 'guide:week-3', dataset: 'daily', expected: week3Web,
    excel: { overall: '=SUMIFS(C2:C31,A2:A31,">=15",A2:A31,"<=21")', scale: 1 },
    sql: { overall: 'SELECT SUM(website_orders) AS week_3_orders\nFROM daily\nWHERE day BETWEEN 15 AND 21;' },
    pandas: { code: `${PD}\ndf["week"] = (df["day"] - 1) // 7 + 1\nweekly = df.groupby("week")["website_orders"].sum()\nweek_3_orders = weekly.loc[3]\nprint(weekly)\n`, total: 'week_3_orders' },
  },
  {
    id: 'guide:app-revenue', dataset: 'daily', expected: revenueApp,
    excel: { overall: '=SUMPRODUCT(D2:D31,E2:E31)', scale: 1 },
    sql: { overall: 'SELECT SUM(app_orders * avg_basket) AS app_revenue\nFROM daily;' },
    pandas: { code: `${PD}\napp_revenue = (df["app_orders"] * df["avg_basket"]).sum()\nprint(app_revenue)\n`, total: 'app_revenue' },
  },
  {
    id: 'guide:missing-cells', dataset: 'daily', expected: 0,
    excel: { overall: '=COUNTBLANK(A2:E31)', scale: 1 },
    sql: { overall: 'SELECT COUNT(*) - COUNT(website_orders) AS missing_web_orders\nFROM daily;' },
    pandas: { code: `${PD}\nmissing_cells = int(df.isna().sum().sum())\nprint(missing_cells)\n`, total: 'missing_cells' },
  },
];

const snippet = (slug, tool) => {
  const m = method(slug);
  return tool === 'excel' ? m.excel : tool === 'sql' ? m.sql : m.pandas;
};

export const DEEP_GUIDES = [
  {
    slug: 'data-analysis-steps',
    title: 'How to do data analysis: six steps, worked on a real example',
    seoTitle: 'How to do data analysis: 6 steps with a worked example',
    description: 'The six steps of data analysis (question, collect, clean, explore, analyse, report), each worked on one 30-day dataset with Excel, SQL and Python code you can run.',
    published: '2026-10-31',
    blocks: [
      { p: `Data analysis is the process of turning rows of records into an answer you can act on. The steps are the same whether the data is sales, support tickets or survey replies, and whether you use a spreadsheet or code. This guide walks through six of them on one small dataset: thirty days of orders from a made-up online store (${n(total, 0)} orders across the website and an app). You can download it as a CSV and follow along.` },
      { h2: '1. Start with a question that has an answer' },
      { p: 'A good question names a number and a comparison. "How are we doing?" cannot be answered. "Did orders grow over the month, and was the one-day sale on day 17 the reason?" can. Write the question down before you open any data, because it decides which columns you need and when you can stop.' },
      { h2: '2. Collect and look at what you have' },
      { p: `Our dataset has five columns: day, ad spend, website orders, app orders and average basket value, with one row per day. Before analysing anything, check its size and shape: 30 rows, no gaps in the days, and values in plausible ranges. Check for blanks too, because a blank cell and a zero are treated differently by most tools.` },
      code('Excel: count blank cells in the data', GUIDE_CHECKS[4].excel.overall),
      code('SQL', GUIDE_CHECKS[4].sql.overall),
      code('Python (pandas)', GUIDE_CHECKS[4].pandas.code),
      { p: 'All three return 0: nothing is missing. In real data you would expect to find something here, and what you do about it is step 3.' },
      { h2: '3. Clean it: fix what would change the answer' },
      { p: 'Cleaning means removing only the problems that would distort the answer: duplicate rows, impossible values (a negative order count), text where numbers should be, dates in two formats, and the same thing spelled two ways. Note what you changed and why. Do not delete an unusual value just because it is unusual; that is step 4.' },
      { ul: [
        'Duplicates: the same order exported twice inflates every total.',
        'Units: rupees in one column and paise in another, or a mix of currencies.',
        'Blanks: decide whether blank means "zero", "unknown" or "not applicable", then treat all of them the same way.',
        'Definitions: did "order" mean the same thing before and after a system change?',
      ] },
      { h2: '4. Explore: describe each number before you compare them' },
      { p: `Summarise each column with a typical value and a spread. The website orders average ${n(meanWeb)} a day with a median of ${n(medianWeb)}; a standard deviation of ${n(sdWeb)} tells you how far days usually sit from that average. Then draw the line over time and look for anything that does not fit.` },
      code('Excel: mean, median and standard deviation', `${snippet('mean', 'excel')}\n${snippet('median', 'excel')}\n${snippet('standard-deviation', 'excel')}`),
      { p: `One day stands out. Day 17 has ${day17.website_orders} website orders when most days are between ${Math.round(S.quantile(web, 0.05))} and ${Math.round(S.quantile(web, 0.95))}. The usual fence for an unusually high value is the third quartile (${n(q3)}) plus 1.5 times the interquartile range, which here is ${n(upperFence)}, so day 17 is flagged. Its z-score is ${n(z17)}: about four standard deviations above the mean. It is a one-day sale, not an error, so it stays in the data. See ` + '[IQR outliers](/methods/iqr-outliers) and [z-scores](/methods/z-score).' },
      { h2: '5. Analyse: answer the question you wrote down' },
      { p: `Now use the method that fits the question. For "did orders grow?", fit a straight line through the days: it projects ${n(forecast31)} website orders for day 31. For "did ad spend bring orders?", measure how the two move together: the correlation is ${n(r, 3)}, and each extra ₹1,000 of daily spend goes with about ${n(perThousand)} more orders. The sale day is part of both of those, so it is worth running them with and without day 17 before you trust either.` },
      code('Python: trend and spend-vs-orders', `${snippet('linear-trend-forecast', 'pandas')}\n# and, on the same data:\n${snippet('correlation', 'pandas').replace(PD, '').trim()}`),
      { p: 'A relationship in the data is a lead, not a cause. Days with more ad spend may also be the days the store ran a sale. Check the explanation with something you know: the calendar, the campaign log.' },
      { h2: '6. Report: the answer first, then how sure you are' },
      { p: 'Write the finding in one sentence a colleague can act on, give the number, say how much data it rests on and what you excluded, and say what you would check next. Keep the working somewhere a reader can find it: the query, the formula, the file. An answer nobody can check will not be trusted twice.' },
      { h2: 'The same steps, shorter, in AnalyzeIt' },
      { p: 'AnalyzeIt follows the same order. You ask the question in plain words; it computes the figures in code rather than guessing them, and each result shows its source and the query that produced it, so step 6 is already attached. You can try it with five free runs and no account at [/try](/try).' },
      { faq: [
        { q: 'What are the steps of data analysis?', a: 'Define the question, collect the data, clean it, explore it, analyse it with a suitable method, and report the result with how sure you are. Real projects loop back: exploring often shows a cleaning problem or a better question.' },
        { q: 'How do I analyse data if I am a beginner?', a: 'Start with one question and one small table. Summarise each column (average, median, spread), draw it over time, then compare groups. A spreadsheet is enough; the worked example above uses nothing beyond basic formulas.' },
        { q: 'How long does data analysis take?', a: 'Most of the time goes on understanding and cleaning the data, not on the calculation. A clean table with a clear question can be answered in minutes; messy data from several systems can take far longer than the analysis itself.' },
        { q: 'Do I need to know SQL or Python?', a: 'No. Spreadsheets cover a lot, and tools that take plain-language questions cover more. SQL and Python become useful when the data no longer fits in a sheet or you need to repeat the work.' },
      ] },
    ],
    cta: { href: '/methods', label: 'Every method used here, with its formula and code' },
  },

  {
    slug: 'data-analysis-methods-and-techniques',
    title: 'Data analysis methods and techniques: what each answers and when to use it',
    seoTitle: 'Data analysis methods and techniques, and when to use each',
    description: 'The main statistical and analytical methods, grouped by the question they answer: averages, spread, relationships, uncertainty and trends, each with a worked value.',
    published: '2026-10-31',
    blocks: [
      { p: 'Data analysis methods are easiest to choose between when you start from the question, not the method name. Is it "what is typical?", "how much does it vary?", "are these two things connected?", "could this be chance?" or "where is this heading?". The tables below group the common methods that way. The values come from one 30-day sample of orders from a made-up store, so you can see what each method actually returns; each name links to a page with the formula, a worked example and code for Excel, SQL and Python.' },
      { h2: 'Descriptive and diagnostic: what happened, and what stands out' },
      { p: 'Descriptive methods summarise data you already have. Diagnostic methods look for where a result came from. They are the base of nearly everything else, and many business questions end here.' },
      { table: { caption: 'Averages and spread, on 30 days of website orders', head: ['Method', 'Answers', 'On the sample'], rows: [
        ['[Mean](/methods/mean)', 'What is the average day?', n(val('mean'))],
        ['[Median](/methods/median)', 'What is the middle day, ignoring extremes?', n(val('median'))],
        ['[Standard deviation](/methods/standard-deviation)', 'How far do days usually sit from the average?', n(val('standard-deviation'))],
        ['[Percentile](/methods/percentile)', 'What value do most days stay below?', n(val('percentile'))],
        ['[IQR outliers](/methods/iqr-outliers)', 'How many unusual days are there?', n(val('iqr-outliers'), 0)],
        ['[Z-score](/methods/z-score)', 'How unusual is one day (here, day 17)?', n(val('z-score'))],
      ] } },
      { p: `The mean (${n(val('mean'))}) sits a little above the median (${n(val('median'))}) because day 17, a one-day sale, pulls it up. When the two disagree, there is usually something skewed or extreme worth looking at before you quote either.` },
      { h2: 'Relationships: are two things connected?' },
      { table: { caption: 'Relationships, on website orders and ad spend', head: ['Method', 'Answers', 'On the sample'], rows: [
        ['[Correlation](/methods/correlation)', 'Do ad spend and orders move together? (−1 to 1)', n(val('correlation'), 3)],
        ['[Linear regression](/methods/linear-regression)', 'How many more orders per ₹1,000 of spend?', n(val('linear-regression'), 3)],
        ['[R-squared](/methods/r-squared)', 'How much of the movement in orders does spend explain?', n(val('r-squared'), 3)],
      ] } },
      { p: 'Correlation and regression describe association, not cause. Both are also easily moved by a single extreme point, so run them with and without it.' },
      { h2: 'Uncertainty and testing: could this be chance?' },
      { table: { caption: 'Testing, on website orders versus app orders', head: ['Method', 'Answers', 'On the sample'], rows: [
        ['[t-test](/methods/t-test)', 'Is the website–app difference bigger than chance? (p-value)', n(pWelch, 4)],
        ['[Standard error](/methods/standard-error)', 'How precise is the average?', n(val('standard-error'))],
        ['[Confidence interval](/methods/confidence-interval)', 'What range is the average likely to sit in? (± half-width)', n(val('confidence-interval'))],
      ] } },
      { p: 'A small p-value means the gap would be unusual if there were no real difference. It does not say the gap is large or important: always report the size of the difference next to it.' },
      { h2: 'Trends over time: where is it heading?' },
      { table: { caption: 'Time, on website orders by day', head: ['Method', 'Answers', 'On the sample'], rows: [
        ['[Moving average](/methods/moving-average)', 'What is the recent level with day-to-day noise smoothed out? (7-day, last day)', n(ma7)],
        ['[Linear trend forecast](/methods/linear-trend-forecast)', 'If the straight-line trend holds, what is day 31?', n(forecast31)],
      ] } },
      { h2: 'Predictive and prescriptive' },
      { p: 'Beyond the descriptive methods are predictive ones (forecasts and models that estimate what is likely next) and prescriptive ones (which choose between actions). They build on the same ground: a forecast is only as good as the history it was tested against, and a recommendation is only as good as the forecast beneath it. Before relying on one, ask how it did on data it had not seen.' },
      { h2: 'How to choose' },
      { ol: [
        'Write the question as one sentence ending in a number or a yes/no.',
        'Pick the row of the tables above that matches it.',
        'Look at the data first (a line chart, a sorted list): a method cannot tell you that the data is wrong.',
        'Report the value with its size, its sample and what you checked it against.',
      ] },
      { faq: [
        { q: 'What are the main types of data analysis?', a: 'Descriptive (what happened), diagnostic (why), predictive (what is likely next) and prescriptive (what to do). Descriptive and diagnostic methods are the most common in everyday business work.' },
        { q: 'What is the difference between a method and a technique?', a: 'In practice the words are used interchangeably. A method is a defined calculation such as a mean or a t-test; a technique is usually a way of applying one or several of them, such as comparing periods or segmenting customers.' },
        { q: 'Which statistical method should I use?', a: 'Choose by question: averages for "what is typical", standard deviation for "how variable", correlation for "are these connected", a test for "could this be chance", and a trend for "where is it going".' },
      ] },
    ],
    cta: { href: '/methods', label: 'All methods, with formulas and code' },
  },

  {
    slug: 'excel-data-analysis',
    title: 'Excel data analysis: the formulas, PivotTables and ToolPak that matter',
    seoTitle: 'Excel data analysis: formulas, PivotTables and the ToolPak',
    description: 'How to analyse data in Excel: the formulas that answer most questions, how to build a PivotTable, and how to turn on the Analysis ToolPak, with every formula tested.',
    published: '2026-10-31',
    blocks: [
      { p: `Excel can answer most day-to-day data questions without any add-ins. This guide uses the same 30-day sample as the rest of our guides: five columns (A day, B ad spend, C website orders, D app orders, E average basket) in rows 2 to 31. Every formula below was calculated against that sheet and returns the figure shown. You can download the data as a CSV to follow along.` },
      { h2: 'Before you start: make the sheet analysable' },
      { ul: [
        'One header row, one record per row, no blank rows or merged cells inside the table.',
        'Numbers stored as numbers. If a column is left-aligned or shows a green triangle, it is probably text.',
        'No totals inside the data range: they get counted twice.',
        'Format the range as a table (Insert → Table) so formulas and PivotTables grow with the data.',
      ] },
      { h2: 'The formulas that answer most questions' },
      { table: { caption: 'Core formulas, with the value each returns on the sample', head: ['Question', 'Formula', 'Result'], rows: [
        ['Total orders, both channels', GUIDE_CHECKS[0].excel.overall, n(total, 0)],
        ['Average website orders per day', method('mean').excel, n(val('mean'))],
        ['Middle day', method('median').excel, n(val('median'))],
        ['Spread of days', method('standard-deviation').excel, n(val('standard-deviation'))],
        ['Do ad spend and orders move together?', method('correlation').excel, n(r, 3)],
        ['App revenue (orders × basket)', GUIDE_CHECKS[3].excel.overall, n(revenueApp, 0)],
        ['Orders in week 3 (days 15 to 21)', GUIDE_CHECKS[2].excel.overall, n(week3Web, 0)],
        ['App share of all orders, %', GUIDE_CHECKS[1].excel.overall, n(appShare)],
      ] } },
      { p: 'Three habits prevent most spreadsheet errors. Use SUMIFS and COUNTIFS (several conditions) in place of nested IFs. Use SUMPRODUCT when you need the sum of a product, as in revenue = orders × price. And keep a copy of the raw data on its own sheet so every figure can be traced back.' },
      { h2: 'Find outliers and trends' },
      { code: { label: 'Excel: the outlier fence and a forecast', code: `${method('iqr-outliers').excel}\n${method('linear-trend-forecast').excel}\n${method('moving-average').excel}` } },
      { p: `The first formula counts days outside the usual fences (${n(val('iqr-outliers'), 0)} here: the day-17 sale). The second projects day 31 from the straight-line trend (${n(forecast31)}). The third is the last 7-day average (${n(ma7)}). A forecast like this assumes the pattern continues, so treat it as a guide, not a promise.` },
      { h2: 'Build a PivotTable' },
      { p: 'A PivotTable summarises a table by groups without writing formulas. To add a week column, put =INT((A2-1)/7)+1 in a new column, then:' },
      { ol: [
        'Click anywhere in the table and choose Insert → PivotTable.',
        'Drag the week column to Rows.',
        'Drag website orders and app orders to Values; make sure each is set to Sum.',
        'Check the grand total against =SUM(C2:D31): they must match before you trust the table.',
      ] },
      { p: 'Remember that a PivotTable does not refresh by itself: right-click it and choose Refresh after the data changes.' },
      { h2: 'Turn on the Analysis ToolPak' },
      { p: 'The Analysis ToolPak is an Excel add-in that adds ready-made tools such as descriptive statistics, regression, t-tests and histograms. In Excel for Windows, go to File → Options → Add-ins, choose Excel Add-ins next to Manage, select Go, tick Analysis ToolPak and press OK. On a Mac it is under Tools → Excel Add-ins. It then appears as Data Analysis on the Data tab. Its output is static: if the data changes, run the tool again. The functions above recalculate by themselves, which is why they are usually the better choice for anything you will repeat.' },
      { h2: 'Where Excel stops being the right tool' },
      { ul: [
        'The file becomes slow, or the data no longer fits in one sheet.',
        'Several people edit copies and nobody knows which is current.',
        'You repeat the same cleaning every week. That is a job for a query or a script, as in the Python and SQL guide.',
        'You want to ask a question in plain words and see the working. That is what AnalyzeIt does with an uploaded file: you can try it with five free runs and no account.',
      ] },
      { faq: [
        { q: 'How do I analyse data in Excel?', a: 'Put the data in a clean table, summarise each column with AVERAGE, MEDIAN and STDEV.S, compare groups with SUMIFS or a PivotTable, then check unusual values and trends. Always check one total by hand.' },
        { q: 'How do I enable the Data Analysis ToolPak in Excel?', a: 'On Windows: File → Options → Add-ins → Manage Excel Add-ins → Go, then tick Analysis ToolPak. On a Mac: Tools → Excel Add-ins. It then appears as Data Analysis on the Data tab.' },
        { q: 'Is Excel good enough for data analysis?', a: 'For tables that fit in a sheet and questions you ask occasionally, yes. For larger data, repeated work or shared results, a database query, a script or a tool built for the job is safer.' },
        { q: 'Which Excel functions are most useful for analysis?', a: 'SUMIFS and COUNTIFS for conditional totals, AVERAGE, MEDIAN and STDEV.S for summaries, CORREL and SLOPE for relationships, QUARTILE.INC for outliers, and FORECAST.LINEAR for a simple trend.' },
      ] },
    ],
    cta: { href: '/methods', label: 'Excel, SQL and Python code for every statistics method' },
  },

  {
    slug: 'python-and-sql-for-data-analysis',
    title: 'Python and SQL for data analysis: the same questions answered both ways',
    seoTitle: 'Python and SQL for data analysis, side by side',
    description: 'Learn when to use SQL and when to use Python (pandas) for data analysis, with the same six questions answered in both and every query run against a sample dataset.',
    published: '2026-10-31',
    blocks: [
      { p: 'SQL and Python solve overlapping problems. SQL is the language for asking questions of data stored in a database. Python, with the pandas library, is a general tool for loading, reshaping and analysing data that also does charts, statistics and automation. Most analysts use both. This guide answers the same questions in each, against a 30-day sample (columns day, ad_spend, website_orders, app_orders, avg_basket). Each snippet was run on that data and returns the value shown. In SQL it works as written in DuckDB, and the simpler ones also in SQLite.' },
      { h2: 'Setup' },
      { code: { label: 'Python: load the sample', code: `${PD}\nprint(df.head())\nprint(df.shape)   # (30, 5)` } },
      { p: 'For SQL, load the same CSV into a table called daily. DuckDB can query the file directly with SELECT * FROM "daily.csv", and SQLite can import it with .import. The queries below assume a table called daily.' },
      { h2: '1. How many orders in total?' },
      { code: { label: 'SQL', code: GUIDE_CHECKS[0].sql.overall } },
      { code: { label: 'Python (pandas)', code: GUIDE_CHECKS[0].pandas.code } },
      { p: `Both return ${n(total, 0)}. In SQL you describe the result you want and the database works out how; in pandas you transform a table step by step.` },
      { h2: '2. What share of orders come from the app?' },
      { code: { label: 'SQL', code: GUIDE_CHECKS[1].sql.overall } },
      { code: { label: 'Python (pandas)', code: GUIDE_CHECKS[1].pandas.code } },
      { p: `${n(appShare)}%. Note the 100.0 in the SQL: dividing two integers in some databases drops the decimals, so make one side a decimal.` },
      { h2: '3. Group by week' },
      { code: { label: 'SQL (one week)', code: GUIDE_CHECKS[2].sql.overall } },
      { code: { label: 'Python (all weeks at once)', code: GUIDE_CHECKS[2].pandas.code } },
      { p: `Week 3 has ${n(week3Web, 0)} website orders. pandas computes every week in one groupby; in SQL the same is a GROUP BY on a week expression.` },
      { h2: '4. Revenue from a price column' },
      { code: { label: 'SQL', code: GUIDE_CHECKS[3].sql.overall } },
      { code: { label: 'Python (pandas)', code: GUIDE_CHECKS[3].pandas.code } },
      { p: `App revenue is ₹${n(revenueApp, 0)}. Multiply first, then add up: adding orders and multiplying by an average basket gives a different number.` },
      { h2: '5. Find the unusual day' },
      { code: { label: 'Python (pandas)', code: snippet('iqr-outliers', 'pandas') } },
      { code: { label: 'SQL (DuckDB or PostgreSQL)', code: snippet('iqr-outliers', 'sql') } },
      { p: `One outlier: day 17, with ${day17.website_orders} website orders against a fence of ${n(upperFence)}. SQLite lacks PERCENTILE_CONT, which is a good example of where SQL dialects differ.` },
      { h2: '6. Trend and relationship' },
      { code: { label: 'SQL (DuckDB or PostgreSQL)', code: `${snippet('correlation', 'sql')}\n\n${snippet('linear-trend-forecast', 'sql')}` } },
      { code: { label: 'Python (pandas, NumPy)', code: snippet('linear-trend-forecast', 'pandas') } },
      { p: `The correlation between ad spend and website orders is ${n(r, 3)} and the straight-line forecast for day 31 is ${n(forecast31)}. Statistical functions like these are one place where Python tends to be more convenient, because libraries such as SciPy and statsmodels cover far more than SQL does.` },
      { h2: 'Which should you learn first?' },
      { ul: [
        'If your data lives in a database or a warehouse, learn SQL first: it is how you get the right rows out.',
        'If you work from files and need charts, statistics or repeatable scripts, learn Python and pandas first.',
        'If you are not sure, a spreadsheet plus SQL covers a great deal of business analysis.',
      ] },
      { h2: 'Or skip the code' },
      { p: 'If you only need the answers, AnalyzeIt writes and runs the query for you and shows it next to the result, so you can check it, or learn from it. You can try it with five free runs and no account.' },
      { faq: [
        { q: 'Is Python or SQL better for data analysis?', a: 'Neither is better in general. SQL is the standard way to query databases and is quick for filtering, joining and aggregating. Python is stronger for statistics, charts, cleaning messy files and automation. Many analysts use SQL to fetch data and Python to analyse it.' },
        { q: 'What do I need to start data analysis with Python?', a: 'Python, the pandas library and a notebook or script. Load a CSV with pd.read_csv, look at it with head() and describe(), then use groupby and the built-in statistics methods.' },
        { q: 'Can I use SQL on a CSV file?', a: 'Yes. DuckDB and SQLite can both query a CSV directly or after importing it, so you can practise SQL without setting up a database server.' },
        { q: 'Why do SQL queries differ between databases?', a: 'The core of SQL is shared, but functions for statistics, dates and string handling differ. For example, SQLite has no percentile function while DuckDB and PostgreSQL do, so check your database when copying a query.' },
      ] },
    ],
    cta: { href: '/tools', label: 'Free browser tools for data and code' },
  },

  {
    slug: 'data-analysis-examples',
    title: 'Data analysis examples: six questions answered from one dataset',
    seoTitle: 'Data analysis examples: 6 worked from one dataset',
    description: 'Six data analysis examples from one 30-day dataset: totals, a sale-day outlier, ad spend versus orders, a trend, a channel test and a forecast, each with its result.',
    published: '2026-10-31',
    blocks: [
      { p: `The best way to understand data analysis is to watch it applied. Each example below asks one question of the same dataset: thirty days of orders from a made-up online store, with ad spend, website orders, app orders and average basket value. The figures are computed from that data, so you can check them yourself (download the CSV) and each links to the method page with its formula and Excel, SQL and Python code.` },
      { h2: 'Example 1: What happened? (totals and shares)' },
      { p: `Question: how many orders did the store get, and how are they split? Adding both channels gives ${n(total, 0)} orders: ${n(webTotal, 0)} on the website and ${n(appTotal, 0)} in the app, so the app is ${n(appShare)}% of orders. This is descriptive analysis: no model, just careful addition, and it is the first thing to get right.` },
      { code: { label: 'SQL', code: GUIDE_CHECKS[1].sql.overall } },
      { h2: 'Example 2: What is unusual? (finding an outlier)' },
      { p: `Question: was any day out of line? Day 17 had ${day17.website_orders} website orders against a typical ${n(medianWeb, 0)}. The interquartile-range rule puts the upper fence at ${n(upperFence)}, and the z-score of day 17 is ${n(z17)}. The conclusion needs context, which the numbers cannot supply: it was a one-day sale, so the right action is to keep it and mention it, not delete it. See [IQR outliers](/methods/iqr-outliers).` },
      { h2: 'Example 3: Are two things connected? (correlation)' },
      { p: `Question: do days with more ad spend get more orders? The correlation between ad spend and website orders is ${n(r, 3)}, a strong positive link, and the fitted line says each extra ₹1,000 of daily spend goes with about ${n(perThousand)} more orders. But day 17 was also the day with the highest spend (₹${n(DAILY[16].ad_spend, 0)}), so the sale and the spend arrive together and the data alone cannot separate them. The honest report says so. See [correlation](/methods/correlation) and [regression](/methods/linear-regression).` },
      { h2: 'Example 4: Is it going up? (trend)' },
      { p: `Question: are website orders growing? A straight line through the 30 days projects ${n(forecast31)} orders on day 31, higher than the 30-day average of ${n(meanWeb)}, so yes: the line rises across the month. A 7-day moving average smooths the noise: the latest value is ${n(ma7)}. See [moving averages](/methods/moving-average) and [linear trend forecast](/methods/linear-trend-forecast).` },
      { h2: 'Example 5: Is the difference real? (a test)' },
      { p: `Question: do website and app orders really differ, or is that gap day-to-day noise? A Welch t-test returns p = ${n(pWelch, 4)}. A p-value that small means a gap this size would be unusual if the two channels had the same true average, so the difference looks real. It does not say how big or how important the gap is; that is what the averages (${n(meanWeb)} against ${n(S.mean(app))}) are for. See the [t-test](/methods/t-test).` },
      { h2: 'Example 6: What do we expect next? (a forecast with limits)' },
      { p: `Question: what might day 31 bring? The trend line says about ${n(forecast31)} website orders. That is a projection, not a measurement: it assumes the last 30 days are a fair guide, that the sale was a one-off and that nothing else changes. A responsible forecast gives a range and says how it was tested. Here you would also want to try it again without the sale day.` },
      { h2: 'What the six examples have in common' },
      { ol: [
        'Each started from a question that names a number.',
        'Each used the simplest method that could answer it.',
        'Each checked the result against what is known about the business (the sale on day 17).',
        'Each reported the value, how much data was behind it and what it does not show.',
      ] },
      { p: 'Real projects are the same in a bigger file. If you want to see it on real public data without signing up, the [case page](/case) shows a full run with its working.' },
      { faq: [
        { q: 'What is an example of data analysis?', a: 'Looking at a store\'s daily orders, finding the day that was far above the rest, checking it was a sale rather than an error, and measuring whether ad spend moves orders. Each of those is a question answered from data with a method.' },
        { q: 'What are examples of data analysis in business?', a: 'Comparing this month with last, finding which product or region moved a total, measuring whether a campaign brought orders, forecasting next month, and flagging a payment method with unusual failures.' },
        { q: 'What is the difference between descriptive and predictive analysis?', a: 'Descriptive analysis summarises what happened (totals, averages, shares). Predictive analysis estimates what is likely next (a trend or forecast) and should state how reliable the estimate is.' },
      ] },
    ],
    cta: { href: '/methods', label: 'The methods behind each example' },
  },

  {
    slug: 'free-online-data-analysis-tools',
    title: 'Free online data analysis tools, and how to choose one',
    seoTitle: 'Free online data analysis tools, and how to choose one',
    description: 'Free ways to analyse data online: spreadsheets, SQL engines, Python, calculators and AI tools, what each is good for, and a checklist for choosing one you can trust.',
    published: '2026-10-31',
    blocks: [
      { p: 'You can do serious data analysis without paying for software. The harder part is choosing, because free tools differ a lot in what they can do, how much data they handle and whether you can see how they reached an answer. This guide groups the free options by type, says what each is good for, and ends with a checklist. It names only tools that are free or open source, and says what we do and do not know about them.' },
      { h2: 'Free tools by type' },
      { table: { caption: 'Free options for data analysis', head: ['Type', 'Examples', 'Good for', 'Watch for'], rows: [
        ['Spreadsheets', 'LibreOffice Calc, Google Sheets', 'Small tables, quick totals, charts, sharing', 'Slows with very large files; easy to break a formula unnoticed'],
        ['SQL on files', 'DuckDB, SQLite', 'Querying CSV files and databases without a server', 'You need to know some SQL; dialects differ'],
        ['Programming', 'Python with pandas, R', 'Statistics, cleaning messy data, repeatable work', 'A setup and learning curve'],
        ['Browser calculators', 'The [metric calculators](/metrics) and [data tools](/tools) on this site', 'One formula or one conversion, with nothing to install and nothing uploaded', 'They answer one question; they do not load your whole file'],
        ['AI tools that take plain questions', '[AnalyzeIt](/try) (five free runs, no account)', 'Asking questions of your own file in plain words', 'Check that the calculation, not a guess, produced the number'],
      ] } },
      { p: 'The first four rows are the standard free route. The last is newer, and the checklist below matters most for it.' },
      { h2: 'A checklist for choosing' },
      { ol: [
        'Can it handle your data size? Try it with the largest file you realistically have.',
        'Can you see the working? A number without its formula or query is a risk, however it is produced.',
        'Where does your data go? Check whether it is uploaded, stored, shared or used to train models, and read the privacy page.',
        'Can you repeat it? A script or saved query that runs again next month saves more time than a one-off click-through.',
        'What happens when you outgrow the free tier? Know the limits before you build a process on top of it.',
      ] },
      { h2: 'Free options for specific jobs' },
      { ul: [
        'A quick formula, such as churn or average order value: a [metric calculator](/metrics) with the formula and a worked example.',
        'Spotting an unusual value in a list: the [IQR outlier method](/methods/iqr-outliers), usable in any spreadsheet.',
        'Formatting or converting data (JSON, CSV, Base64, timestamps): the [free browser tools](/tools), which run in your browser.',
        'Public figures by country: the World Bank-based [country data pages](/data), each with its source.',
        'Practising analysis: the [sample datasets](/sample-data/daily.csv) used throughout our guides, made up and free to use.',
      ] },
      { h2: 'Free tools and AI: how to stay safe' },
      { p: 'Large language models can write fluent analysis that is wrong. For numbers, prefer tools that compute in code and show the source, and check one figure by hand against something you already trust. Do not paste confidential customer data into any online tool without reading how it is handled.' },
      { h2: 'Using AnalyzeIt for free' },
      { p: 'You can run five analyses on your own file at [/try](/try) with no account. Answers show the figures, the query that produced them and how sure the evidence is, so you can check them. After the five runs, a free account lets you keep going within the Free plan limits; the plans page lists what each plan includes.' },
      { faq: [
        { q: 'What is the best free data analysis tool?', a: 'It depends on the job. For small tables, a spreadsheet; for querying files, DuckDB or SQLite; for statistics and repeatable work, Python or R; for plain-language questions, an AI tool that shows its working.' },
        { q: 'Can I analyse data online for free?', a: 'Yes. Browser-based spreadsheets, online calculators and tools with a free tier let you analyse data without installing anything. Check the limits on file size and how your data is handled.' },
        { q: 'Is free data analysis software accurate?', a: 'The mathematics in established tools such as spreadsheets, SQL engines, Python and R is reliable; errors usually come from the data or the way a formula is set up. Check one result by hand whatever tool you use.' },
        { q: 'What free tool should a beginner start with?', a: 'A spreadsheet, because you can see every number. Once you outgrow it, add SQL for querying or Python for analysis.' },
      ] },
    ],
    cta: { href: '/try', label: 'Try AnalyzeIt free, no account' },
  },
];
