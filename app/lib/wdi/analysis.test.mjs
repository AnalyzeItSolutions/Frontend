// The analysis on /data pages: every sentence follows from the numbers, and nothing is claimed that the checks do not support.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { GUIDES } from '../guides.mjs';
import { method } from '../pseo/methods.mjs';
import { analysisText, biggestMoves, fitLine, latestMove, projection, recentTrend, yearlyChanges } from './analysis.mjs';

const series = (start, values) => values.map((value, i) => ({ year: start + i, value }));
// Steady ~2% growth with a little wobble, so the spread of yearly changes is small but not zero.
const growth = (n, last) => {
  const v = [100];
  for (let i = 1; i < n; i++) v.push(v[i - 1] * (1 + (i % 2 ? 0.019 : 0.021)));
  if (last) v[n - 1] = v[n - 2] * (1 + last);
  return series(2000, v);
};
const line = (n, noise = 0.05) => series(2000, Array.from({ length: n }, (_, i) => 50 + 3 * i + (i % 2 ? noise : -noise)));

describe('yearly changes', () => {
  it('uses percent for positive levels and points for rates, and skips gaps', () => {
    const lv = yearlyChanges(series(2000, [100, 110, 121]), 'level');
    assert.equal(lv.unit, 'percent');
    assert.ok(Math.abs(lv.changes[1].change - 10) < 1e-9);
    const pct = yearlyChanges(series(2000, [5, 7, 6]), 'pct');
    assert.equal(pct.unit, 'points');
    assert.deepEqual(pct.changes.map((c) => c.change), [2, -1]);
    const gap = yearlyChanges([{ year: 2000, value: 1 }, { year: 2002, value: 2 }, { year: 2003, value: 3 }], 'level');
    assert.equal(gap.changes.length, 1);
    assert.equal(yearlyChanges(series(2000, [-1, 2, 3]), 'level').unit, 'units');
    assert.equal(yearlyChanges(series(2000, [70, 71, 72]), 'level', 'Life expectancy at birth, total (years)').unit, 'units');
    assert.equal(yearlyChanges(series(2000, [70, 71, 72]), 'level', 'Population, total').unit, 'percent');
  });
});

describe('latest move', () => {
  it('calls a normal year ordinary and a jump unusual', () => {
    assert.equal(latestMove(growth(20), 'level').size, 'ordinary');
    const big = latestMove(growth(20, 0.12), 'level');
    assert.equal(big.size, 'unusual');
    assert.ok(big.z > 2 && big.n === 18);
  });
  it('says nothing without enough history or when the latest year is missing', () => {
    assert.equal(latestMove(growth(8), 'level'), null);
    const gappy = growth(20).slice(0, -1).concat([{ year: 2025, value: 150 }]);
    assert.equal(latestMove(gappy, 'level'), null);
    assert.equal(latestMove(series(2000, Array(20).fill(5)), 'pct'), null, 'a constant series has no spread to compare with');
  });
});

describe('biggest moves', () => {
  it('finds the largest rise and fall, and omits a direction that never happened', () => {
    const b = biggestMoves(series(2000, [1, 2, 3, 4, 5, 6, 7, 8, 9, 3, 4, 5]), 'pct');
    assert.equal(b.rise.year, 2001 + 0);
    assert.equal(b.fall.year, 2009);
    assert.equal(biggestMoves(series(2000, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 'pct').fall, null);
  });
});

describe('trend and projection', () => {
  it('fits a line exactly', () => {
    const f = fitLine(series(2000, [1, 3, 5, 7]));
    assert.equal(f.slope, 2);
    assert.equal(f.r2, 1);
    assert.equal(f.at(2004), 9);
  });
  it('reports a direction, or none when the line explains little', () => {
    assert.equal(recentTrend(line(15)).direction, 'up');
    const noisy = series(2000, [5, 9, 4, 10, 3, 9, 5, 10, 4, 9, 5, 10]);
    assert.equal(recentTrend(noisy).direction, 'flat');
    assert.equal(recentTrend(line(6)), null);
  });
  it('projects a steady trend three years out, with its backtest error', () => {
    const p = projection(line(20));
    assert.equal(p.year, 2022);
    assert.ok(Math.abs(p.value - (50 + 3 * 22)) < 0.5, String(p.value));
    assert.ok(p.error < p.naiveError * 0.8);
  });
  it('declines to project noise, short series, or a trend that just broke', () => {
    assert.equal(projection(series(2000, [5, 9, 4, 10, 3, 9, 5, 10, 4, 9, 5, 10, 4, 9, 5, 10])), null);
    assert.equal(projection(line(12)), null);
    const broke = line(20).map((p, i) => (i >= 17 ? { ...p, value: line(20)[16].value } : p));
    assert.equal(projection(broke), null, 'the last three years went flat, so the line failed its own test');
  });
});

describe('analysis text', () => {
  it('writes sentences that follow from the numbers and contain no placeholder', () => {
    const t = analysisText({ country: 'Testland', name: 'population, total', kind: 'level', points: growth(20, 0.12) });
    const all = Object.values(t).flat().join(' ');
    assert.match(t.move[0], /^In 2019, Testland's population, total rose 12% on 2018/);
    assert.match(t.move[1], /standard deviations above that average, so it was unusually large/);
    assert.doesNotMatch(all, /undefined|NaN|Infinity|null/);
    assert.ok(t.biggest[0].includes('2019'));
  });
  it("handles names that end in s and rates in percentage points", () => {
    const t = analysisText({ country: 'United States', name: 'inflation (annual %)', kind: 'pct', points: line(20) });
    assert.match(t.move[0], /^In 2019, United States' inflation/);
    assert.match(t.trend[0], /about 3 percentage points a year/);
  });
  it('is empty for a series too short to say anything', () => {
    const t = analysisText({ country: 'X', name: 'y', kind: 'level', points: series(2015, [1, 2, 3, 4, 5]) });
    assert.deepEqual(Object.values(t).flat(), []);
  });
  it('words a projection as a continuation of the pattern and shows the test it passed', () => {
    const t = analysisText({ country: 'X', name: 'y', kind: 'level', points: line(20) });
    assert.match(t.projection[0], /better than "no change"/);
    assert.match(t.projection[0], /not a forecast of events/);
  });
});

describe('the /data page that shows it', () => {
  it('links only to methods and guides that exist', () => {
    const page = fs.readFileSync(path.resolve(import.meta.dirname, '../../data/[country]/[indicator]/page.tsx'), 'utf8');
    for (const m of page.matchAll(/href="\/methods\/([a-z-]+)"/g)) assert.ok(method(m[1]), `no method ${m[1]}`);
    for (const m of page.matchAll(/href="\/guides\/([a-z-]+)"/g)) assert.ok(GUIDES.some((g) => g.slug === m[1]), `no guide ${m[1]}`);
    assert.match(page, /analysisText\(/);
  });
});
