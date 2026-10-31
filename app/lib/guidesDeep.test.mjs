// The six long guides: complete, free of placeholders, linking only to pages that exist, with code that is run by
// scripts/seo/verify_snippets.py (GUIDE_CHECKS is exported to it by export_snippets.mjs).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { DEEP_GUIDES, GUIDE_CHECKS } from './guidesDeep.mjs';
import { GUIDES, wordCount, blockText } from './guides.mjs';
import { method } from './pseo/methods.mjs';
import { TITLE_MAX, withBrand } from './seo/snippets.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const text = (g) => g.blocks.flatMap(blockText).join(' ');
const links = (g) => [...JSON.stringify(g.blocks).matchAll(/\]\((\/[^)\s"\\]*)\)/g)].map((m) => m[1]);

describe('deep guides', () => {
  it('are six, in the guide list, with a title that fits a search result', () => {
    assert.equal(DEEP_GUIDES.length, 6);
    for (const g of DEEP_GUIDES) {
      assert.ok(GUIDES.includes(g), g.slug);
      assert.ok(g.seoTitle && withBrand(g.seoTitle).length <= TITLE_MAX + ' — AnalyzeIt'.length && g.seoTitle.length <= TITLE_MAX, `${g.slug}: seoTitle ${g.seoTitle.length}`);
      assert.ok(g.description.length >= 80 && g.description.length <= 170, `${g.slug}: description ${g.description.length}`);
    }
    const titles = GUIDES.map((g) => g.seoTitle ?? g.title);
    assert.equal(new Set(titles).size, titles.length);
  });

  it('are long, have headings, a FAQ and code or a table', () => {
    for (const g of DEEP_GUIDES) {
      assert.ok(wordCount(g) >= 550, `${g.slug}: ${wordCount(g)} words`);
      assert.ok(g.blocks.filter((b) => b.h2).length >= 4, `${g.slug}: headings`);
      assert.ok(g.blocks.some((b) => b.faq && b.faq.length >= 3), `${g.slug}: FAQ`);
      assert.ok(g.blocks.some((b) => b.code || b.table), `${g.slug}: code or table`);
    }
  });

  it('show no placeholder, and every figure is a real number', () => {
    for (const g of DEEP_GUIDES) {
      const all = JSON.stringify(g.blocks);
      assert.doesNotMatch(all, /undefined|NaN|\[object|null/, g.slug);
      assert.doesNotMatch(text(g), /\b(\d{1,3}(\.\d+)?)\s?% of (businesses|companies|people|users)/i, `${g.slug}: made-up statistic`);
    }
  });

  it('link only to pages that exist', () => {
    for (const g of DEEP_GUIDES) {
      for (const href of links(g)) {
        const clean = href.split('#')[0];
        const m = clean.match(/^\/methods\/([a-z0-9-]+)$/);
        if (m) { assert.ok(method(m[1]), `${g.slug}: no method ${m[1]}`); continue; }
        if (/^\/sample-data\/(daily|monthly)\.csv$/.test(clean)) continue;
        const dir = path.join(root, 'app', clean.replace(/^\//, ''));
        assert.ok(fs.existsSync(path.join(dir, 'page.tsx')) || fs.existsSync(path.join(dir, 'route.ts')), `${g.slug}: ${href} has no page`);
      }
      assert.ok(fs.existsSync(path.join(root, 'app', g.cta.href.replace(/^\//, ''), 'page.tsx')), `${g.slug}: cta`);
    }
  });

  it('use only made-up sample data and say so', () => {
    for (const g of DEEP_GUIDES.filter((g) => !/free-online/.test(g.slug))) assert.match(text(g), /sample|made-up/i, `${g.slug} must say its data is a sample`);
    for (const g of DEEP_GUIDES) assert.doesNotMatch(text(g), /\bour customers\b|\bcase study\b/i, g.slug);
  });

  it('publish code that the verifier runs: every guide-only snippet has all three tools', () => {
    assert.ok(GUIDE_CHECKS.length >= 5);
    for (const c of GUIDE_CHECKS) {
      assert.ok(c.excel.overall.startsWith('='), c.id);
      assert.match(c.sql.overall, /^SELECT/, c.id);
      assert.match(c.pandas.code, /read_csv\("daily.csv"\)/, c.id);
      assert.ok(Number.isFinite(c.expected), c.id);
    }
    // Every guide-only snippet that a guide prints is one of the checked ones.
    const printed = DEEP_GUIDES.flatMap((g) => g.blocks.filter((b) => b.code).map((b) => b.code.code));
    const everything = JSON.stringify(DEEP_GUIDES.map((g) => g.blocks));
    for (const c of GUIDE_CHECKS) {
      const used = printed.some((p) => p.includes(c.sql.overall) || p.includes(c.pandas.code)) || everything.includes(JSON.stringify(c.excel.overall).slice(1, -1));
      assert.ok(used, `${c.id} is not used`);
    }
  });
});
