// How the guides, methods, metrics and tools point at each other, kept in one place so the links are chosen, not accidental,
// and a test can check that every target exists and that nothing is left without a way in.
// External references go to reference pages (Wikipedia for the idea, the library's own documentation for the function) and are
// checked once with scripts/seo/check_external_links.mjs; the unit test only checks their shape.

/** Related reading for every guide: other guides, the methods and metrics it uses, and the browser tools that help. */
export const GUIDE_LINKS = {
  'find-what-changed-in-your-data': { guides: ['real-change-or-random-noise', 'data-analysis-steps', 'forecast-without-fooling-yourself', 'data-analysis-examples', 'free-public-datasets-and-how-to-check-them'], methods: ['moving-average', 'z-score', 'iqr-outliers'], metrics: ['revenue-growth-rate', 'conversion-rate', 'payment-failure-rate'], tools: ['percentage-calculator', 'cagr-calculator'] },
  'real-change-or-random-noise': { guides: ['find-what-changed-in-your-data', 'data-analysis-methods-and-techniques', 'forecast-without-fooling-yourself'], methods: ['standard-deviation', 'z-score', 't-test', 'confidence-interval'], metrics: ['conversion-rate', 'customer-churn-rate'], tools: [] },
  'free-public-datasets-and-how-to-check-them': { guides: ['clean-a-messy-csv', 'data-analysis-steps', 'free-online-data-analysis-tools'], methods: ['iqr-outliers', 'mean', 'median'], metrics: [], tools: ['csv-to-json', 'json-formatter'] },
  'clean-a-messy-csv': { guides: ['data-analysis-steps', 'free-public-datasets-and-how-to-check-them', 'excel-data-analysis', 'python-and-sql-for-data-analysis'], methods: ['iqr-outliers', 'median'], metrics: [], tools: ['csv-to-json', 'json-to-csv', 'regex-tester'] },
  'forecast-without-fooling-yourself': { guides: ['real-change-or-random-noise', 'find-what-changed-in-your-data', 'data-analysis-examples'], methods: ['linear-trend-forecast', 'moving-average', 'linear-regression', 'confidence-interval'], metrics: ['mrr-growth-rate', 'compound-monthly-growth-rate', 'revenue-growth-rate'], tools: ['cagr-calculator'] },
  'chat-with-your-data': { guides: ['analyze-data-without-sql-or-code', 'chatgpt-or-a-data-analysis-tool', 'choose-a-data-analysis-tool'], methods: [], metrics: [], tools: [] },
  'analyze-data-without-sql-or-code': { guides: ['chat-with-your-data', 'spreadsheet-or-ai-data-tool', 'data-analysis-steps', 'python-and-sql-for-data-analysis', 'types-of-data-analysis'], methods: ['mean', 'correlation'], metrics: [], tools: [] },
  'chatgpt-or-a-data-analysis-tool': { guides: ['chat-with-your-data', 'choose-a-data-analysis-tool', 'free-online-data-analysis-tools'], methods: [], metrics: [], tools: [] },
  'spreadsheet-or-ai-data-tool': { guides: ['excel-data-analysis', 'choose-a-data-analysis-tool', 'analyze-data-without-sql-or-code', 'free-online-data-analysis-tools'], methods: [], metrics: [], tools: [] },
  'types-of-data-analysis': { guides: ['data-analysis-methods-and-techniques', 'data-analysis-examples', 'data-analysis-steps'], methods: ['mean', 'correlation', 'linear-trend-forecast'], metrics: [], tools: [] },
  'data-visualization-techniques-and-examples': { guides: ['data-analysis-examples', 'data-analysis-steps', 'choose-a-data-analysis-tool'], methods: ['moving-average', 'correlation'], metrics: [], tools: ['color-converter'] },
  'choose-a-data-analysis-tool': { guides: ['free-online-data-analysis-tools', 'spreadsheet-or-ai-data-tool', 'chatgpt-or-a-data-analysis-tool', 'python-and-sql-for-data-analysis'], methods: [], metrics: [], tools: [] },
  'data-analysis-steps': { guides: ['data-analysis-examples', 'data-analysis-methods-and-techniques', 'clean-a-messy-csv', 'excel-data-analysis', 'python-and-sql-for-data-analysis', 'types-of-data-analysis'], methods: ['mean', 'median', 'standard-deviation', 'iqr-outliers', 'correlation'], metrics: [], tools: ['csv-to-json'] },
  'data-analysis-methods-and-techniques': { guides: ['data-analysis-steps', 'data-analysis-examples', 'types-of-data-analysis', 'real-change-or-random-noise'], methods: ['mean', 'standard-deviation', 'correlation', 't-test', 'linear-trend-forecast'], metrics: [], tools: [] },
  'excel-data-analysis': { guides: ['python-and-sql-for-data-analysis', 'data-analysis-steps', 'spreadsheet-or-ai-data-tool', 'clean-a-messy-csv', 'data-visualization-techniques-and-examples'], methods: ['mean', 'median', 'correlation', 'linear-regression'], metrics: ['average-order-value', 'gross-margin', 'conversion-rate'], tools: ['percentage-calculator'] },
  'python-and-sql-for-data-analysis': { guides: ['excel-data-analysis', 'data-analysis-steps', 'analyze-data-without-sql-or-code', 'clean-a-messy-csv'], methods: ['iqr-outliers', 'correlation', 'linear-trend-forecast'], metrics: ['customer-churn-rate', 'average-order-value'], tools: ['csv-to-json', 'regex-tester'] },
  'data-analysis-examples': { guides: ['data-analysis-steps', 'data-analysis-methods-and-techniques', 'forecast-without-fooling-yourself', 'real-change-or-random-noise', 'free-public-datasets-and-how-to-check-them', 'data-visualization-techniques-and-examples'], methods: ['iqr-outliers', 'correlation', 'linear-regression', 't-test', 'linear-trend-forecast'], metrics: ['average-order-value', 'conversion-rate'], tools: [] },
  'free-online-data-analysis-tools': { guides: ['choose-a-data-analysis-tool', 'spreadsheet-or-ai-data-tool', 'excel-data-analysis', 'python-and-sql-for-data-analysis', 'data-visualization-techniques-and-examples'], methods: [], metrics: [], tools: ['json-formatter', 'csv-to-json', 'percentage-calculator', 'cagr-calculator'] },
};

/** Browser tools that sit next to a guide topic, shown on the tool's page. */
export const TOOL_GUIDES = {
  'json-formatter': ['clean-a-messy-csv', 'free-online-data-analysis-tools'],
  'csv-to-json': ['clean-a-messy-csv', 'python-and-sql-for-data-analysis'],
  'json-to-csv': ['clean-a-messy-csv', 'excel-data-analysis'],
  'percentage-calculator': ['find-what-changed-in-your-data', 'excel-data-analysis'],
  'cagr-calculator': ['forecast-without-fooling-yourself', 'find-what-changed-in-your-data'],
  'regex-tester': ['clean-a-messy-csv'],
  'unix-timestamp': ['clean-a-messy-csv'],
  'color-converter': ['data-visualization-techniques-and-examples'],
};

/** The guide that teaches the tool a metric or method page shows code for. */
export const GUIDE_FOR_TOOL = { excel: 'excel-data-analysis', sql: 'python-and-sql-for-data-analysis', python: 'python-and-sql-for-data-analysis' };

/** Methods worth checking on any monthly metric: how much it varies, what is smooth, what is unusual. */
export const METRIC_METHODS = ['standard-deviation', 'moving-average', 'z-score', 'linear-trend-forecast'];

/** Guides for a metric group (the groups on /metrics). Every group gets the general ones. */
export const METRIC_GUIDES = ['find-what-changed-in-your-data', 'real-change-or-random-noise', 'excel-data-analysis'];

// Reference pages for the methods: Wikipedia for the idea, the function's own documentation where one is exact.
const WIKI = (t) => `https://en.wikipedia.org/wiki/${t}`;
const PANDAS = (f) => `https://pandas.pydata.org/docs/reference/api/pandas.${f}.html`;
export const METHOD_REFS = {
  'mean': [['Arithmetic mean (Wikipedia)', WIKI('Arithmetic_mean')], ['pandas: DataFrame.mean', PANDAS('DataFrame.mean')]],
  'median': [['Median (Wikipedia)', WIKI('Median')], ['pandas: DataFrame.median', PANDAS('DataFrame.median')]],
  'weighted-average': [['Weighted arithmetic mean (Wikipedia)', WIKI('Weighted_arithmetic_mean')]],
  'geometric-mean': [['Geometric mean (Wikipedia)', WIKI('Geometric_mean')]],
  'standard-deviation': [['Standard deviation (Wikipedia)', WIKI('Standard_deviation')], ['pandas: DataFrame.std', PANDAS('DataFrame.std')]],
  'variance': [['Variance (Wikipedia)', WIKI('Variance')], ['pandas: DataFrame.var', PANDAS('DataFrame.var')]],
  'range': [['Range (statistics) (Wikipedia)', WIKI('Range_(statistics)')]],
  'interquartile-range': [['Interquartile range (Wikipedia)', WIKI('Interquartile_range')]],
  'percentile': [['Percentile (Wikipedia)', WIKI('Percentile')], ['pandas: DataFrame.quantile', PANDAS('DataFrame.quantile')]],
  'z-score': [['Standard score (Wikipedia)', WIKI('Standard_score')]],
  'iqr-outliers': [['Outlier (Wikipedia)', WIKI('Outlier')]],
  'coefficient-of-variation': [['Coefficient of variation (Wikipedia)', WIKI('Coefficient_of_variation')]],
  'mean-absolute-deviation': [['Average absolute deviation (Wikipedia)', WIKI('Average_absolute_deviation')]],
  'skewness': [['Skewness (Wikipedia)', WIKI('Skewness')], ['pandas: DataFrame.skew', PANDAS('DataFrame.skew')]],
  'kurtosis': [['Kurtosis (Wikipedia)', WIKI('Kurtosis')], ['pandas: DataFrame.kurt', PANDAS('DataFrame.kurt')]],
  'correlation': [['Correlation (Wikipedia)', WIKI('Correlation')], ['pandas: Series.corr', PANDAS('Series.corr')]],
  'linear-regression': [['Linear regression (Wikipedia)', WIKI('Linear_regression')], ['NumPy: polyfit', 'https://numpy.org/doc/stable/reference/generated/numpy.polyfit.html']],
  'r-squared': [['Coefficient of determination (Wikipedia)', WIKI('Coefficient_of_determination')]],
  't-test': [["Welch's t-test (Wikipedia)", WIKI("Welch's_t-test")], ['SciPy: ttest_ind', 'https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.ttest_ind.html']],
  'standard-error': [['Standard error (Wikipedia)', WIKI('Standard_error')]],
  'confidence-interval': [['Confidence interval (Wikipedia)', WIKI('Confidence_interval')]],
  'moving-average': [['Moving average (Wikipedia)', WIKI('Moving_average')], ['pandas: DataFrame.rolling', PANDAS('DataFrame.rolling')]],
  'linear-trend-forecast': [['Linear trend estimation (Wikipedia)', WIKI('Linear_trend_estimation')]],
};
/** One general reference for the whole methods section. */
export const NIST_HANDBOOK = ['NIST/SEMATECH e-Handbook of Statistical Methods', 'https://www.itl.nist.gov/div898/handbook/'];

/** Guides that use a method: the curated list, plus any guide that links to the method in its text. */
export function guidesForMethod(slug, guides) {
  return guides.filter((g) => GUIDE_LINKS[g.slug]?.methods.includes(slug) || JSON.stringify(g.blocks).includes(`](/methods/${slug})`));
}
