import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createExtensionClient } from './extensionClient.mjs';

function fakeWindow() {
  const w = new EventEmitter();
  w.location = { origin: 'https://analyzeit.in' };
  w.sent = [];
  w.addEventListener = (t, f) => w.on(t, f);
  w.postMessage = (m) => w.sent.push(m);
  w.deliver = (data, origin = w.location.origin, source = w) => w.emit('message', { data, origin, source });
  return w;
}

test('connects on hello, ignores other origins and sources', () => {
  const w = fakeWindow();
  const c = createExtensionClient(w);
  assert.equal(c.state.connected, false);
  w.deliver({ source: 'analyzeit-extension', type: 'hello', version: '0.1.0' }, 'https://evil.example');
  w.deliver({ source: 'analyzeit-extension', type: 'hello', version: '0.1.0' }, w.location.origin, {});
  assert.equal(c.state.connected, false);
  w.deliver({ source: 'analyzeit-extension', type: 'hello', version: '0.1.0', platforms: { x: {} } });
  assert.equal(c.state.connected, true);
  assert.equal(c.state.version, '0.1.0');
});

test('fill refuses when not connected, and sends the exact approved text when connected', async () => {
  const w = fakeWindow();
  const c = createExtensionClient(w);
  assert.equal((await c.fill({ draftId: 'd', platform: 'x', text: 'hi', text_sha256: 'h' })).ok, false);
  w.deliver({ source: 'analyzeit-extension', type: 'hello', version: '1' });
  const p = c.fill({ draftId: 'd', platform: 'x', text: 'hi', text_sha256: 'h' });
  assert.deepEqual(w.sent.at(-1), { source: 'analyzeit-app', type: 'fill', draftId: 'd', platform: 'x', text: 'hi', sha256: 'h' });
  w.deliver({ source: 'analyzeit-extension', type: 'accepted', draftId: 'd', ok: true });
  assert.equal((await p).ok, true);
});

test('results reach listeners', () => {
  const w = fakeWindow();
  const c = createExtensionClient(w);
  const got = [];
  c.onResult((r) => got.push(r));
  w.deliver({ source: 'analyzeit-extension', type: 'result', draftId: 'd', ok: true, state: 'filled' });
  assert.equal(got[0].state, 'filled');
});

test('plans: sends the plan with its hash and reports progress and the result', async () => {
  const w = fakeWindow();
  const c = createExtensionClient(w);
  w.deliver({ source: 'analyzeit-extension', type: 'hello', version: '1' });
  const events = [];
  c.onPlan((m) => events.push(m.type));
  const p = c.runPlan({ id: 'bp_1', title: 'T', mode: 'fill_only', steps: [{ type: 'wait', ms: 1 }], plan_sha256: 'abc' });
  assert.deepEqual(w.sent.at(-1), { source: 'analyzeit-app', type: 'plan', plan: { id: 'bp_1', title: 'T', mode: 'fill_only', steps: [{ type: 'wait', ms: 1 }] }, sha256: 'abc' });
  w.deliver({ source: 'analyzeit-extension', type: 'plan-accepted', planId: 'bp_1', ok: true });
  assert.equal((await p).ok, true);
  w.deliver({ source: 'analyzeit-extension', type: 'plan-progress', planId: 'bp_1', index: 0, status: 'running' });
  w.deliver({ source: 'analyzeit-extension', type: 'plan-result', planId: 'bp_1', ok: true, results: [] });
  assert.deepEqual(events, ['plan-progress', 'plan-result']);
  const c2 = createExtensionClient(fakeWindow());
  assert.equal((await c2.runPlan({ id: 'x', steps: [], mode: 'fill_only', plan_sha256: '' })).ok, false);
});
