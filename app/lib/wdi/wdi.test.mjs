// Guards for /data and /indicators: the index only promises pages that have real data, URLs are unique and stable, and the
// sentences on a page follow from the numbers.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

import { lowerFirst, changeSentence, fmtNum, fmtValue, kindOf, ordinal, rankAmong, summarize } from './describe.mjs';

const read = (f) => JSON.parse(fs.readFileSync(path.join(import.meta.dirname, f), 'utf8'));
const meta = read('meta.json'), cells = read('cells.json'), defs = read('defs.json');

describe('WDI index', () => {
  it('every page in the index has enough recent data', () => {
    let n = 0;
    for (const [id, cs] of Object.entries(cells)) {
      for (const [ci, obs, first, last, value] of cs) {
        n++;
        assert.ok(meta.countries[ci], `${id}: country ${ci}`);
        assert.ok(obs >= meta.min_obs && last >= meta.min_last_year && first <= last && Number.isFinite(value), `${id}/${meta.countries[ci][0]}`);
      }
    }
    assert.equal(n, meta.pages);
    assert.ok(meta.pages > 100000, 'the index is the full set, not a sample');
  });
  it('URLs are unique and do not collide with other routes', () => {
    const cs = meta.countries.map((c) => c[2]), is = meta.indicators.map((i) => i[2]);
    assert.equal(new Set(cs).size, cs.length);
    assert.equal(new Set(is).size, is.length);
    for (const s of [...cs, ...is]) assert.match(s, /^[a-z0-9]+(-[a-z0-9]+)*$/, s);
    for (const reserved of ['sitemap', 'country', 'indicators']) assert.ok(!cs.includes(reserved), reserved);
  });
  it('indicators have a definition and every region a country points to exists', () => {
    for (const [id] of meta.indicators) assert.ok(defs[id] && defs[id].def.length > 20, `${id} has a definition`);
    const codes = new Set(meta.countries.map((c) => c[0]));
    for (const c of meta.countries) if (c[3]) assert.ok(codes.has(c[3]), `${c[0]} region ${c[3]}`);
    assert.ok(Object.keys(cells).every((id) => meta.indicators.some((i) => i[0] === id)));
  });
});

describe('page sentences', () => {
  const series = [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024].map((year, i) => ({ year, value: i === 3 ? null : 100 + i * 10 }));
  it('levels change in percent with a compound rate', () => {
    const s = summarize(series, 'level');
    assert.equal(s.latest.value, 200);
    assert.equal(s.ten.from.year, 2014);
    assert.equal(s.ten.pct, 100);
    assert.ok(Math.abs(s.ten.cagr - (Math.pow(2, 1 / 10) - 1) * 100) < 1e-9);
    assert.equal(s.missing, 1);
    assert.match(changeSentence(s.ten, 'level'), /^up 100% from 100 in 2014 \(7\.18% a year/);
  });
  it('rates change in percentage points, not percent', () => {
    const s = summarize([{ year: 2020, value: 6.2 }, { year: 2025, value: 4.7 }], 'pct');
    assert.equal(changeSentence(s.five, 'pct'), 'down 1.5 percentage points from 6.2% in 2020');
  });
  it('no five-year comparison when that year is missing', () => {
    const s = summarize([{ year: 2018, value: 1 }, { year: 2025, value: 2 }], 'level');
    assert.equal(s.five, null);
  });
  it('formats numbers people can read', () => {
    assert.equal(fmtNum(3.912e12), '3.91 trillion');
    assert.equal(fmtNum(1428627663), '1.43 billion');
    assert.equal(fmtValue(-2.5e9, 'usd'), '−US$2.5 billion');
    assert.equal(fmtValue(4.951, 'pct'), '4.95%');
    assert.equal(kindOf('Inflation, consumer prices (annual %)'), 'pct');
    assert.equal(kindOf('GDP (current US$)'), 'usd');
    assert.equal(kindOf('Population, total'), 'level');
    assert.equal(fmtNum(0.619), '0.62');
    assert.equal(lowerFirst('GDP (current US$)'), 'GDP (current US$)');
    assert.equal(lowerFirst('Population, total'), 'population, total');
  });
  it('ranks highest first', () => {
    assert.deepEqual(rankAmong([{ value: 5 }, { value: 9 }, { value: 1 }], 5), { rank: 2, of: 3 });
    assert.deepEqual([1, 2, 3, 11, 12, 13, 21, 22, 101].map(ordinal), ['1st', '2nd', '3rd', '11th', '12th', '13th', '21st', '22nd', '101st']);
  });
});
