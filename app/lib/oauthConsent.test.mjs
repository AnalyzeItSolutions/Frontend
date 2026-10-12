import test from 'node:test';
import assert from 'node:assert/strict';
import { consentPath, isSafeRedirect, lastUsed, parseRequestId } from './oauthConsent.mjs';

const id = 'req_' + 'a'.repeat(43);

test('accepts only a well-formed request id', () => {
  assert.equal(parseRequestId(`?request=${id}`), id);
  for (const bad of ['', '?request=', '?request=abc', `?request=${id}%26x`, '?request=req_short', `?request=${'x'.repeat(90)}`, `?request=${id}/../`]) {
    assert.equal(parseRequestId(bad), null, bad);
  }
  assert.equal(consentPath(id), `/oauth/consent?request=${id}`);
});

test('only navigates to the host the user was shown', () => {
  const ok = 'https://claude.ai/api/mcp/auth_callback?code=abc&state=s';
  assert.equal(isSafeRedirect(ok, 'claude.ai'), true);
  assert.equal(isSafeRedirect('http://127.0.0.1:53123/callback?code=x', '127.0.0.1:53123'), true);
  for (const [r, host] of [
    ['https://evil.example/cb?code=abc', 'claude.ai'],
    ['http://claude.ai/cb', 'claude.ai'],
    ['http://evil.example/cb', 'evil.example'],
    ['javascript:alert(1)', 'claude.ai'],
    ['https://user:pw@claude.ai/cb', 'claude.ai'],
    ['https://claude.ai.evil.example/cb', 'claude.ai'],
    ['https://claude.ai/cb#frag', 'claude.ai'],
    ['https://claude.ai/cb', ''], ['https://claude.ai/cb', undefined], [null, 'claude.ai'], ['', 'claude.ai'],
  ]) assert.equal(isSafeRedirect(r, host), false, String(r));
});

test('last used wording', () => {
  assert.equal(lastUsed(null), 'Not used yet');
  assert.equal(lastUsed(1000, 1030), 'Used just now');
  assert.equal(lastUsed(1000, 1000 + 7200), 'Used 2 h ago');
  assert.equal(lastUsed(1000, 1000 + 3 * 86400), 'Used 3 d ago');
});
