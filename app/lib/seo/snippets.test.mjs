// Every programmatic page's search snippet, built from the real indexes: short enough not to be cut,
// unique within its set, and never showing a placeholder.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { describe, it } from 'node:test';
import { DESC_MAX, TITLE_MAX, convertSnippet, countrySnippet, dataSnippet, fit, indicatorSnippet, unicodeSnippet, withBrand } from './snippets.mjs';
import { fmtValue, kindOf, rankAmong } from '../wdi/describe.mjs';
import { isVisible, titleCase, uPlus, utf8 } from '../unicode/encode.mjs';
import { PAIRS, convert, nice } from '../convert/units.mjs';

const json = (p) => JSON.parse(fs.readFileSync(new URL(p, import.meta.url), 'utf8'));
const BAD = /undefined|NaN|null|\[object/;

function check(name, snippets, { unique = true, longTitles = false } = {}) {
  const titles = new Set();
  for (const s of snippets) {
    if (!longTitles) assert.ok(s.title.length <= TITLE_MAX, `${name} title ${s.title.length}: ${s.title}`);
    assert.ok(s.description.length >= 50 && s.description.length <= DESC_MAX, `${name} description ${s.description.length}: ${s.description}`);
    assert.ok(!BAD.test(s.title) && !BAD.test(s.description), `${name}: ${s.title} | ${s.description}`);
    if (unique) {
      assert.ok(!titles.has(s.title), `${name} duplicate title: ${s.title}`);
      titles.add(s.title);
    }
  }
}

describe('search snippets', () => {
  it('fit takes the first candidate that fits and cuts the last one at a word', () => {
    assert.equal(fit(['a long candidate', 'short'], 10), 'short');
    const cut = fit(['one two three four five six seven'], 20);
    assert.ok(cut.endsWith('…') && cut.length <= 20, cut);
    assert.equal(withBrand('Short'), 'Short — AnalyzeIt');
    assert.equal(withBrand('x'.repeat(50)), 'x'.repeat(50));
  });

  it('puts the answer first on a data page', () => {
    const s = dataSnippet({ country: 'India', indicator: 'GDP growth (annual %)', value: '6.5%', year: 2024, first: 1961, obs: 64, rank: { rank: 12, of: 190 } });
    assert.equal(s.title, 'India GDP growth (annual %): 6.5% (2024), 1961–2024 data');
    assert.match(s.description, /^India's GDP growth \(annual %\) was 6\.5% in 2024, the 12th highest of 190 economies\./);
  });

  it('fits every World Bank country and indicator page', () => {
    const meta = json('../wdi/meta.json');
    const cells = json('../wdi/cells.json');
    const countries = meta.countries;
    const out = [];
    for (const [id, name] of meta.indicators) {
      const list = cells[id] ?? [];
      const byYear = new Map();
      for (const c of list) if (!countries[c[0]][5]) byYear.set(c[3], [...(byYear.get(c[3]) ?? []), { value: c[4] }]);
      for (const c of list) {
        const same = byYear.get(c[3]) ?? [];
        const rank = !countries[c[0]][5] && same.length >= 10 ? rankAmong(same, c[4]) : null;
        out.push(dataSnippet({ country: countries[c[0]][1], indicator: name, value: fmtValue(c[4], kindOf(name)), year: c[3], first: c[2], obs: c[1], rank }));
      }
    }
    assert.ok(out.length > 200000);
    // Long indicator names keep the whole name, so titles stay unique; short ones must fit.
    check('data', out, { longTitles: true });
    for (const s of out) assert.ok(s.title.length <= TITLE_MAX || / — /.test(s.title), s.title);
    const fits = out.filter((s) => s.title.length <= TITLE_MAX).length;
    console.log(`data titles: ${fits} of ${out.length} fit in ${TITLE_MAX} characters, answer first; the rest lead with country, year and value`);
    check('indicator', meta.indicators.map(([, name]) => indicatorSnippet({ indicator: name, year: 2024, economies: 190 })), { unique: false });
    check('country', countries.map(([, name]) => countrySnippet({ country: name, indicators: 1200 })));
  });

  it('fits every Unicode character page', () => {
    const chars = json('../unicode/chars.json');
    const out = chars.map(([cp, name, gc, , , , , , , , , , , , emoji, entities]) => {
      const html = entities?.length ? `&${entities[0].replace(/^&|;$/g, '')};` : `&#${cp};`;
      const display = emoji ? emoji.charAt(0).toUpperCase() + emoji.slice(1) : /^[A-Z0-9 -]+$/.test(name) ? titleCase(name) : name;
      const bytes = utf8(cp).map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
      return unicodeSnippet({ glyph: isVisible(gc) ? String.fromCodePoint(cp) : '', name: display, uplus: uPlus(cp), html, bytes, emoji: !!emoji });
    });
    check('unicode', out, { unique: false });
    assert.equal(unicodeSnippet({ glyph: '→', name: 'Rightwards Arrow', uplus: 'U+2192', html: '&rarr;', bytes: 'E2 86 92' }).title, '→ Rightwards Arrow (U+2192): copy and paste, HTML code');
  });

  it('fits every unit conversion page and states the answer', () => {
    const out = PAIRS.map((p) => {
      const one = nice(convert(p, 1));
      return convertSnippet({ fromPlural: p.from.plural, toPlural: p.to.plural, fromSymbol: p.from.symbol, toSymbol: p.to.symbol, fromName: p.from.name, toWord: one === '1' ? p.to.name : p.to.plural, one });
    });
    check('convert', out);
    for (const s of out) assert.match(s.title, /: 1 .+ = /);
  });
});
