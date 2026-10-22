// Guards for /convert: every pair has its reverse, conversions round-trip, display rounding hides float noise only.
// Exact values are checked against the Pint library by scripts/seo/verify_units.py.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CATEGORIES, PAIRS, convert, nice, pair, tableInputs } from './units.mjs';

describe('unit conversions', () => {
  it('every pair has its reverse and round-trips', () => {
    assert.equal(new Set(PAIRS.map((p) => p.slug)).size, PAIRS.length);
    for (const p of PAIRS) {
      const back = pair(`${p.to.id}-to-${p.from.id}`);
      assert.ok(back, p.slug);
      for (const v of [1, 37.5, -12]) assert.ok(Math.abs(convert(back, convert(p, v)) - v) < 1e-9 * Math.max(1, Math.abs(v)), `${p.slug} ${v}`);
      for (const v of tableInputs(p)) assert.ok(Number.isFinite(convert(p, v)), p.slug);
    }
    assert.equal(PAIRS.length, CATEGORIES.reduce((n, c) => n + c.units.length * (c.units.length - 1), 0));
  });
  it('knows the famous values', () => {
    assert.equal(nice(convert(pair('feet-to-centimeters'), 1)), '30.48');
    assert.equal(nice(convert(pair('celsius-to-fahrenheit'), -40)), '-40');
    assert.equal(nice(convert(pair('celsius-to-fahrenheit'), 37)), '98.6');
    assert.equal(nice(convert(pair('gigabytes-to-gibibytes'), 1000)), '931.3225746');
    assert.equal(nice(convert(pair('miles-to-kilometers'), 26.2)), '42.1648128');
  });
});
