import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { adapters, canSend, markPosted, parsePost, validate } from './lib.mjs';

const raw = '---\nplatform: x\nstatus: draft\n---\nOne https://a.co/x\n===\nTwo';
describe('social queue', () => {
  it('parses a thread', () => {
    const p = parsePost(raw);
    assert.equal(p.meta.platform, 'x');
    assert.deepEqual(p.parts, ['One https://a.co/x', 'Two']);
  });
  it('counts links as 23 on X and flags long text', () => {
    assert.deepEqual(validate({ meta: { platform: 'x' }, parts: ['a ' + 'https://example.com/' + 'z'.repeat(200)] }), []);
    assert.match(validate({ meta: { platform: 'x' }, parts: ['a'.repeat(281)] })[0], /allows 280/);
    assert.match(validate({ meta: { platform: 'linkedin' }, parts: ['a', 'b'] })[0], /threads/);
  });
  it('never sends a draft, never without --yes, never twice', () => {
    assert.match(canSend({ meta: { status: 'draft' } }, { yes: true }), /approved/);
    assert.match(canSend({ meta: { status: 'approved' } }, { yes: false }), /dry run/);
    assert.match(canSend({ meta: { status: 'posted', posted: 'u' } }, { yes: true }), /already posted/);
    assert.equal(canSend({ meta: { status: 'approved' } }, { yes: true }), null);
  });
  it('marks a post as posted', () => {
    const out = markPosted(raw, 'https://x.com/i/status/1');
    assert.match(out, /status: posted/);
    assert.match(out, /posted: https:\/\/x\.com/);
  });
  it('threads replies on X and declares links on Bluesky', async () => {
    const calls = [];
    const f = async (url, o) => { calls.push([url, JSON.parse(o.body)]); return { ok: true, text: async () => JSON.stringify({ data: { id: String(calls.length) } }) }; };
    assert.equal(await adapters.x(['a', 'b'], { X_USER_TOKEN: 't' }, f), 'https://x.com/i/status/1');
    assert.equal(calls[1][1].reply.in_reply_to_tweet_id, '1');
    const bs = [];
    const g = async (url, o) => { const b = JSON.parse(o.body); bs.push(b); return { ok: true, text: async () => JSON.stringify({ accessJwt: 'j', did: 'd', uri: 'at://d/app.bsky.feed.post/abc', cid: 'c' }) }; };
    await adapters.bluesky(['hi https://www.analyzeit.si/guides é'], { BLUESKY_HANDLE: 'h' }, g);
    assert.equal(bs[1].record.facets[0].features[0].uri, 'https://www.analyzeit.si/guides');
    assert.equal(bs[1].record.facets[0].index.byteStart, 3);
  });
});
