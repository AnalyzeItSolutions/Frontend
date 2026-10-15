import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { light, dark, buildCss } from './tokens.mjs';
import { targets } from './build-tokens.mjs';

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

test('generated token files are current (web and desktop)', () => {
  for (const t of targets) {
    if (!existsSync(t)) continue; // desktop checkout may be absent in some deploys
    assert.equal(readFileSync(t, 'utf8'), buildCss(), `${t} is stale: run node design/build-tokens.mjs`);
  }
});

test('light and dark define the same tokens', () => {
  assert.deepEqual(Object.keys(light).sort(), Object.keys(dark).sort());
});

test('text and brand contrast meets WCAG AA', () => {
  for (const [name, t] of [['light', light], ['dark', dark]]) {
    for (const bg of ['bg', 'surface']) {
      assert.ok(ratio(t['text-primary'], t[bg]) >= 7, `${name} primary on ${bg}`);
      assert.ok(ratio(t['text-secondary'], t[bg]) >= 4.5, `${name} secondary on ${bg}`);
      assert.ok(ratio(t['text-muted'], t[bg]) >= 4.5, `${name} muted on ${bg}`);
      assert.ok(ratio(t['accent-text'], t[bg]) >= 4.5, `${name} accent text on ${bg}`);
    }
    assert.ok(ratio(t['brand-ink'], t.brand) >= 4.5, `${name} button text on brand`);
  }
});
