// Guards for the /metrics and /methods reference pages: unique, not thin, internally consistent, and every sentence that
// describes the sample data still true of it. The code on the pages is checked separately by scripts/seo/verify_snippets.py.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DAILY, MONTHLY, MONTHLY_COLUMNS, toCsv } from './data.mjs';
import { results } from './expr.mjs';
import { METRICS } from './metrics.mjs';
import { METHODS, TOOLS, allMethodPaths, allMetricPaths, metricFaq, metricMeta, methodMeta, methodToolMeta, methodTools, toolGuide, toolMeta } from './pages.mjs';
import * as S from './stats.mjs';

const words = (s) => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];
const shingles = (s, k = 4) => { const w = words(s); return new Set(w.slice(0, w.length - k + 1).map((_, i) => w.slice(i, i + k).join(' '))); };
const jaccard = (a, b) => { let n = 0; for (const x of a) if (b.has(x)) n++; return n / (a.size + b.size - n); };
const metricText = (m) => [m.answer, m.why, m.read, ...m.pitfalls].join(' ');
const methodText = (m) => [m.answer, m.why, m.read, ...m.pitfalls].join(' ');

describe('sample data', () => {
  it('monthly rows are consistent month to month', () => {
    MONTHLY.forEach((r, i) => {
      assert.equal(r.customers_end, r.customers_start + r.new_customers - r.customers_churned, `${r.month} subscribers`);
      assert.equal(r.mrr_end, r.mrr_start + r.mrr_new + r.mrr_expansion - r.mrr_contraction - r.mrr_churned, `${r.month} MRR`);
      if (i) assert.equal(r.customers_start, MONTHLY[i - 1].customers_end, `${r.month} starts where the last month ended`);
      if (i) assert.equal(r.mrr_start, MONTHLY[i - 1].mrr_end);
      assert.equal(r.payments_captured, r.orders - r.orders_cod, `${r.month}: prepaid orders are the captured payments`);
      assert.ok(r.add_to_carts > r.checkouts && r.checkouts > r.orders && r.repeat_customers < r.buying_customers);
      for (const c of MONTHLY_COLUMNS) assert.ok(c.key in r, `${r.month} has ${c.key}`);
    });
  });
  it('CSV has one header and one line per row', () => {
    assert.equal(toCsv('monthly').trim().split('\n').length, MONTHLY.length + 1);
    assert.equal(toCsv('daily').trim().split('\n').length, DAILY.length + 1);
  });
});

describe('metric pages', () => {
  it('every metric computes to a finite figure and links only to metrics that exist', () => {
    const slugs = new Set(METRICS.map((m) => m.slug));
    assert.equal(slugs.size, METRICS.length, 'slugs are unique');
    for (const m of METRICS) {
      assert.ok(Number.isFinite(results(m).overall), m.slug);
      assert.ok(m.related.length >= 2, `${m.slug} links to related metrics`);
      for (const r of m.related) assert.ok(slugs.has(r), `${m.slug} → ${r}`);
      assert.equal(m.pitfalls.length, 3, m.slug);
    }
  });
  it('titles and descriptions are unique and the right length', () => {
    const metas = [...METRICS.map(metricMeta), ...METRICS.flatMap((m) => TOOLS.map((t) => toolMeta(m, t))), ...METHODS.map(methodMeta), ...METHODS.flatMap((m) => TOOLS.filter((t) => methodTools(m).includes(t.slug)).map((t) => methodToolMeta(m, t)))];
    assert.equal(new Set(metas.map((x) => x.title)).size, metas.length, 'unique titles');
    assert.equal(new Set(metas.map((x) => x.description)).size, metas.length, 'unique descriptions');
    for (const x of metas) assert.ok(x.description.length >= 50 && x.description.length <= 160, `${x.description.length}: ${x.description}`);
  });
  // Hand-written prose only; the rendered page adds its own data table, computed figures, calculator and code on top.
  it('are not thin: each hub page carries enough of its own words', () => {
    for (const m of METRICS) {
      const text = metricText(m) + ' ' + metricFaq(m).map((f) => f.a).join(' ');
      assert.ok(words(text).length >= 200, `${m.slug} has ${words(text).length} words of its own`);
    }
    for (const m of METHODS) assert.ok(words(methodText(m)).length >= 130, `${m.slug} has ${words(methodText(m)).length} words of its own`);
  });
  it('are not near-duplicates of each other', () => {
    const all = [...METRICS.map((m) => [m.slug, shingles(metricText(m))]), ...METHODS.map((m) => [m.slug, shingles(methodText(m))])];
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const sim = jaccard(all[i][1], all[j][1]);
        assert.ok(sim < 0.25, `${all[i][0]} and ${all[j][0]} share ${(sim * 100).toFixed(0)}% of their phrasing`);
      }
    }
  });
  it('tool pages differ from each other, not only by the tool name', () => {
    const m = METRICS[0];
    const [a, b] = ['excel', 'sql'].map((t) => shingles(JSON.stringify(toolGuide(m, TOOLS.find((x) => x.slug === t)))));
    assert.ok(jaccard(a, b) < 0.3);
  });
  it('page count is what the sitemap lists', () => {
    assert.equal(allMetricPaths().length, METRICS.length * (TOOLS.length + 1));
    assert.equal(allMethodPaths().length, METHODS.reduce((n, m) => n + 1 + methodTools(m).length, 0));
  });
});

describe('what the method pages say about the 30-day data', () => {
  const web = DAILY.map((r) => r.website_orders), app = DAILY.map((r) => r.app_orders), spend = DAILY.map((r) => r.ad_spend), basket = DAILY.map((r) => r.avg_basket);
  const both = web.map((w, i) => w + app[i]);
  const no17 = (xs) => xs.filter((_, i) => i !== 16);
  it('day 17 is the sale: most orders, highest spend, smallest basket, and the only IQR outlier', () => {
    assert.equal(web[16], Math.max(...web));
    assert.equal(spend[16], Math.max(...spend));
    assert.equal(basket[16], Math.min(...basket));
    assert.equal(both[16], Math.max(...both));
    assert.equal(METHODS.find((m) => m.slug === 'iqr-outliers').compute(), 1);
    assert.equal(web[16], 61, 'the text names 61 orders');
  });
  it('day 17 carries much of the spend–orders correlation and of R²', () => {
    assert.ok(S.correl(no17(spend), no17(web)) < 0.6 * S.correl(spend, web), 'r roughly halves without it');
    assert.ok(S.rsq(no17(web), no17(spend)) < 0.5 * S.rsq(web, spend), 'most of the R² comes from it');
    assert.equal(Math.min(...spend), 3000, 'the text says the line is fitted between ₹3,000 and ₹7,200');
    assert.equal(Math.max(...spend), 7200);
  });
  it('averages compare the way the text says', () => {
    assert.ok(S.sum(basket.map((b, i) => b * both[i])) / S.sum(both) < S.mean(basket), 'weighted basket below simple average');
    assert.ok(Math.exp(S.mean(basket.map(Math.log))) < S.mean(basket), 'geometric below arithmetic');
    assert.ok(S.mean(web) > S.median(web), 'the sale lifts the mean above the median');
    assert.equal(Math.round(METHODS.find((m) => m.slug === 'mean-absolute-deviation').compute()), 5, '"about 5 orders away"');
    const cv = METHODS.find((m) => m.slug === 'coefficient-of-variation').compute();
    assert.ok(cv > 17 && cv < 25, '"around 20%"');
  });
  it('spread and shape claims hold', () => {
    assert.ok(S.sd(no17(web)) < 0.75 * S.sd(web), 'standard deviation much smaller without day 17');
    const range = (xs) => Math.max(...xs) - Math.min(...xs);
    assert.ok(range(no17(web)) < range(web) / 2, 'range shrinks to less than half');
    const iqr = (xs) => S.quantile(xs, 0.75) - S.quantile(xs, 0.25);
    assert.ok(Math.abs(iqr(no17(web)) - iqr(web)) <= 1, 'the IQR hardly notices the sale');
    assert.ok(S.skew(web) > 1 && Math.abs(S.skew(no17(web))) < 0.5, 'positive skew, near symmetric without the sale');
    const z = (61 - S.mean(no17(web))) / S.sd(no17(web));
    assert.ok(z > 1.4 * METHODS.find((m) => m.slug === 'z-score').compute(), 'leaving day 17 out of the baseline gives a much larger z');
    assert.ok(METHODS.find((m) => m.slug === 't-test').compute() < 0.001, '"far below 0.05"');
  });
  it('the stats library agrees with known values', () => {
    assert.ok(Math.abs(S.tUpper(0.025, 29) - 2.0452296) < 1e-5, 't(0.975, 29)');
    assert.ok(Math.abs(S.tTwoTailed(2.0452296, 29) - 0.05) < 1e-6);
    assert.equal(S.quantile([1, 2, 3, 4], 0.5), 2.5);
  });
});
