// Every example shown on a /tools page is run here, every default input must work, and results are cross-checked against
// independent implementations where one exists (Node's Buffer and crypto).
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { describe, it } from 'node:test';

import { TOOLS, parseCsv, tool } from './tools.mjs';

const run = async (slug, values, mode) => tool(slug).run(values, mode);

describe('tools', () => {
  it('have unique slugs, text and at least two paragraphs of explanation', () => {
    assert.equal(new Set(TOOLS.map((t) => t.slug)).size, TOOLS.length);
    for (const t of TOOLS) {
      assert.ok(t.how.length >= 2 && t.answer.length > 60, t.slug);
      assert.ok(t.description.length >= 50 && t.description.length <= 160, `${t.slug} description ${t.description.length}`);
    }
  });
  for (const t of TOOLS) {
    it(`${t.slug}: examples give the shown output and the default input works`, async () => {
      for (const ex of t.examples) assert.equal(await run(t.slug, ex.values, ex.mode), ex.output, JSON.stringify(ex.values));
      const defaults = Object.fromEntries(t.fields.map((f) => [f.key, f.default]));
      await run(t.slug, defaults, t.modes?.[0].id); // the page opens in the first mode
    });
  }
  it('agree with Node for Base64 and hashes', async () => {
    for (const s of ['', 'a', 'Hello, नमस्ते 👋', 'x'.repeat(1000)]) {
      assert.equal(await run('base64', { input: s }, 'encode'), Buffer.from(s, 'utf8').toString('base64'));
      assert.equal(await run('base64', { input: Buffer.from(s, 'utf8').toString('base64url') }, 'decode'), s);
      for (const alg of ['SHA-1', 'SHA-256', 'SHA-512']) assert.equal(await run('hash-generator', { input: s }, alg), createHash(alg.replace('-', '').toLowerCase()).update(s, 'utf8').digest('hex'));
    }
  });
  it('round-trip CSV and JSON, including quotes and line breaks', async () => {
    const rows = [{ a: 'x, "y"', b: 'line1\nline2' }, { a: 'plain', b: '' }];
    const csv = await run('json-to-csv', { input: JSON.stringify(rows) });
    assert.deepEqual(JSON.parse(await run('csv-to-json', { input: csv }, ',')), rows);
    assert.deepEqual(parseCsv('a;b\r\n1;"2;3"', ';'), [['a', 'b'], ['1', '2;3']]);
    await assert.rejects(run('csv-to-json', { input: 'a\n"open' }, ','), /never closed/);
  });
  it('report errors in plain words', async () => {
    await assert.rejects(run('json-formatter', { input: '{"a":1,}' }, 'format'), /Invalid JSON/);
    await assert.rejects(run('cagr-calculator', { start: '0', end: '5', years: '2' }), /positive/);
    await assert.rejects(run('number-base-converter', { input: '0x1G' }, 'auto'), /base-16/);
    await assert.rejects(run('percentage-calculator', { a: '0', b: '5' }, 'change'), /undefined/);
  });
  it('match known reference values', async () => {
    assert.match(await run('color-converter', { input: '#777777' }), /Contrast with white: 4\.48:1/); // the classic just-below-AA grey
    assert.match(await run('number-base-converter', { input: '18446744073709551615' }, '10'), /0xFFFFFFFFFFFFFFFF/);
    assert.equal(await run('case-converter', { input: 'parseHTTPResponse' }, 'snake'), 'parse_httpresponse');
    assert.equal((await run('uuid-generator', { count: '3' })).split('\n').filter((u) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(u)).length, 3);
  });
});
