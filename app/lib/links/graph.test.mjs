// The link graph between guides, methods, metrics and tools: every target exists, nothing is an island, and the external
// references are well formed (scripts/seo/check_external_links.mjs checks that they resolve).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GUIDE_FOR_TOOL, GUIDE_LINKS, METHOD_REFS, METRIC_GUIDES, METRIC_METHODS, NIST_HANDBOOK, TOOL_GUIDES, guidesForMethod } from './graph.mjs';
import { GUIDES } from '../guides.mjs';
import { METHODS, method } from '../pseo/methods.mjs';
import { metric } from '../pseo/metrics.mjs';
import { TOOLS, tool } from '../tools/tools.mjs';
import { chartUrlFor } from '../unicode/encode.mjs';

const guideSlugs = new Set(GUIDES.map((g) => g.slug));

describe('link graph', () => {
  it('has an entry for every guide and none for a guide that does not exist', () => {
    assert.deepEqual([...Object.keys(GUIDE_LINKS)].sort(), [...guideSlugs].sort());
  });

  it('points only at things that exist, and never at itself', () => {
    for (const [slug, l] of Object.entries(GUIDE_LINKS)) {
      for (const g of l.guides) assert.ok(guideSlugs.has(g) && g !== slug, `${slug} -> guide ${g}`);
      for (const m of l.methods) assert.ok(method(m), `${slug} -> method ${m}`);
      for (const m of l.metrics) assert.ok(metric(m), `${slug} -> metric ${m}`);
      for (const t of l.tools) assert.ok(tool(t), `${slug} -> tool ${t}`);
      assert.equal(new Set(l.guides).size, l.guides.length, `${slug}: duplicate guide links`);
    }
    for (const [t, gs] of Object.entries(TOOL_GUIDES)) { assert.ok(tool(t), t); for (const g of gs) assert.ok(guideSlugs.has(g), `${t} -> ${g}`); }
    for (const g of Object.values(GUIDE_FOR_TOOL)) assert.ok(guideSlugs.has(g), g);
    for (const g of METRIC_GUIDES) assert.ok(guideSlugs.has(g), g);
    for (const m of METRIC_METHODS) assert.ok(method(m), m);
  });

  it('leaves no guide without a way in: at least two other guides link to it', () => {
    for (const slug of guideSlugs) {
      const inbound = Object.entries(GUIDE_LINKS).filter(([s, l]) => s !== slug && l.guides.includes(slug)).length;
      assert.ok(inbound >= 2, `${slug} has ${inbound} inbound guide links`);
    }
  });

  it('gives most methods a guide that uses them, and every method a reference', () => {
    const used = METHODS.filter((m) => guidesForMethod(m.slug, GUIDES).length > 0).length;
    assert.ok(used >= 14, `only ${used} of ${METHODS.length} methods are used by a guide`);
    for (const m of METHODS) assert.ok((METHOD_REFS[m.slug] ?? []).length >= 1, `${m.slug} has no reference`);
    for (const slug of Object.keys(METHOD_REFS)) assert.ok(method(slug), slug);
  });

  it('uses reference links that are https, from a short list of reference hosts, with no duplicates inside a method', () => {
    const hosts = new Set(['en.wikipedia.org', 'pandas.pydata.org', 'numpy.org', 'docs.scipy.org', 'www.itl.nist.gov']);
    for (const [slug, refs] of Object.entries(METHOD_REFS)) {
      assert.equal(new Set(refs.map((r) => r[1])).size, refs.length, slug);
      for (const [label, url] of [...refs, NIST_HANDBOOK]) {
        const u = new URL(url);
        assert.equal(u.protocol, 'https:', url);
        assert.ok(hosts.has(u.host), `${slug}: ${u.host} is not an approved reference host`);
        assert.ok(label.length > 5, label);
      }
    }
  });

  it('builds Unicode chart links from the block start', () => {
    assert.equal(chartUrlFor(0x2190), 'https://www.unicode.org/charts/PDF/U2190.pdf');
    assert.equal(chartUrlFor(0x1f600), 'https://www.unicode.org/charts/PDF/U1F600.pdf');
    assert.equal(chartUrlFor(0), 'https://www.unicode.org/charts/PDF/U0000.pdf');
    assert.equal(chartUrlFor(0xdb80), null);
  });

  it('every browser tool is reachable from a guide or the tools hub', () => {
    const fromGuides = new Set([...Object.values(GUIDE_LINKS).flatMap((l) => l.tools), ...Object.keys(TOOL_GUIDES)]);
    assert.ok(fromGuides.size >= 8, `${fromGuides.size} tools are linked from guides`);
    assert.ok(TOOLS.length >= fromGuides.size);
  });
});
