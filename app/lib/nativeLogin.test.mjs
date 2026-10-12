import test from 'node:test';
import assert from 'node:assert/strict';
import { clientLabel, isSafeCallback, nativeLoginPath, parseNativeParams } from './nativeLogin.mjs';

const state = 's'.repeat(24);
const challenge = 'c'.repeat(43);
const ok = `?port=53123&state=${state}&challenge=${challenge}&client=cli`;

test('accepts a well-formed request', () => {
  assert.deepEqual(parseNativeParams(ok), { port: 53123, state, challenge, client: 'cli' });
});

test('rejects malformed or hostile requests', () => {
  const bad = [
    '', '?port=80&state=' + state + '&challenge=' + challenge + '&client=cli',
    `?port=53123&state=short&challenge=${challenge}&client=cli`,
    `?port=53123&state=${state}&challenge=${'c'.repeat(42)}&client=cli`,
    `?port=53123&state=${state}&challenge=${challenge}&client=evil`,
    `?port=53123&state=${state}%26x%3D1&challenge=${challenge}&client=cli`,
    `?port=99999&state=${state}&challenge=${challenge}&client=cli`,
    `?port=abc&state=${state}&challenge=${challenge}&client=cli`,
  ];
  for (const b of bad) assert.equal(parseNativeParams(b), null, b);
});

test('only navigates to the app’s own loopback callback', () => {
  const good = `http://127.0.0.1:53123/callback?code=abc&state=${state}`;
  assert.equal(isSafeCallback(good, 53123, state), true);
  for (const r of [
    `https://127.0.0.1:53123/callback?code=abc&state=${state}`,
    `http://localhost:53123/callback?code=abc&state=${state}`,
    `http://127.0.0.1:53124/callback?code=abc&state=${state}`,
    `http://127.0.0.1:53123/other?code=abc&state=${state}`,
    `http://evil.example/callback?code=abc&state=${state}`,
    `http://127.0.0.1@evil.example:53123/callback?code=abc&state=${state}`,
    `http://user:pw@127.0.0.1:53123/callback?code=abc&state=${state}`,
    `http://127.0.0.1:53123/callback?code=abc&state=other`,
    `http://127.0.0.1:53123/callback?state=${state}`,
    'javascript:alert(1)', '', null, undefined,
  ]) assert.equal(isSafeCallback(r, 53123, state), false, String(r));
});

test('the login redirect keeps the request intact', () => {
  assert.equal(nativeLoginPath(ok), `/native-login${ok}`);
});

test('accepts the Claude plugin as a client and labels it plainly', () => {
  const r = parseNativeParams(ok.replace('client=cli', 'client=plugin'));
  assert.equal(r?.client, 'plugin');
  assert.equal(clientLabel('plugin'), 'the AnalyzeIt plugin for Claude');
  assert.equal(clientLabel('cli'), 'the AnalyzeIt command line');
});
