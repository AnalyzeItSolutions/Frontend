// Guards for /unicode. Encodings are checked against Python's codecs for every character by scripts/seo/verify_unicode.py.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { describe, it } from 'node:test';
import { codes, decomposition, htmlRefWorks, titleCase, utf16, utf8 } from './encode.mjs';

const chars = JSON.parse(fs.readFileSync(new URL('./chars.json', import.meta.url), 'utf8'));

describe('unicode', () => {
  it('index has unique code points and only named characters', () => {
    assert.equal(new Set(chars.map((c) => c[0])).size, chars.length);
    assert.ok(chars.length > 30000);
    for (const c of chars) assert.ok(c[1] && !/^</.test(c[1]) && !['Co', 'Cs'].includes(c[2]), c[0]);
  });
  it('encodes like the standards say', () => {
    assert.deepEqual(utf8(0xe9), [0xc3, 0xa9]);
    assert.deepEqual(utf8(0x1f602), [0xf0, 0x9f, 0x98, 0x82]);
    assert.deepEqual(utf16(0x1f602), [0xd83d, 0xde02]);
    assert.equal(Buffer.from(String.fromCodePoint(0x20ac)).toString('hex'), utf8(0x20ac).map((b) => b.toString(16)).join(''));
    const row = Object.fromEntries(codes(0x1f602, { name: 'FACE WITH TEARS OF JOY' }));
    assert.equal(row.JavaScript, '\\u{1F602} or \\uD83D\\uDE02');
    assert.equal(row.Python, '\\U0001F602');
    assert.equal(JSON.parse(`"${row.JSON}"`), '😂');
  });
  it('does not offer HTML references that the HTML Standard rejects', () => {
    assert.ok(!htmlRefWorks(0) && !htmlRefWorks(0x0d) && !htmlRefWorks(0x85) && htmlRefWorks(0x0a) && htmlRefWorks(0xa0));
    assert.equal(Object.fromEntries(codes(0x80)).HTML.startsWith('not valid'), true);
  });
  it('reads decompositions and names', () => {
    assert.deepEqual(decomposition('0065 0301'), { canonical: true, tag: null, cps: [0x65, 0x301] });
    assert.equal(decomposition('<compat> 0020 0301').tag, 'compat');
    assert.equal(titleCase('LATIN SMALL LETTER E WITH ACUTE'), 'Latin Small Letter E With Acute');
  });
});
