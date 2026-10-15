import test from 'node:test';
import assert from 'node:assert/strict';
import { PLATFORMS, canApprove, charsLeft, extensionBlock, extensionLabel, fillMessage, isDirty, statusLabel } from './drafts.mjs';

const d = (over = {}) => ({ id: 'dr_1', platform: 'x', text: 'hello', status: 'draft', text_sha256: 'h', ...over });
const ext = (over = {}, plat = {}) => ({ connected: true, version: '0.1.0', paused: false, platforms: { x: { label: 'X', allowed: true, cap: 5, used: 0, paused: false, ...plat } }, ...over });

test('limits match the backend', () => {
  assert.deepEqual(Object.fromEntries(PLATFORMS.map((p) => [p.id, p.limit])), { x: 280, bluesky: 300, threads: 500, linkedin: 3000, reddit: 40000 });
  assert.equal(charsLeft('x', 'a'.repeat(300)), -20);
});

test('only saved, non-empty, in-limit drafts can be approved', () => {
  assert.equal(canApprove(d()), true);
  assert.equal(canApprove(d(), 'hello edited'), false, 'unsaved edit');
  assert.equal(canApprove(d({ text: '   ' })), false);
  assert.equal(canApprove(d({ text: 'a'.repeat(281) })), false);
  for (const status of ['approved', 'sent', 'cancelled']) assert.equal(canApprove(d({ status })), false);
  assert.equal(isDirty(d(), 'x'), true);
  assert.equal(isDirty(d(), undefined), false);
});

test('labels and extension gating', () => {
  assert.equal(statusLabel('sent'), 'Posted');
  assert.equal(extensionLabel(null), 'Not connected');
  assert.equal(extensionLabel(ext()), 'Connected · v0.1.0');
  assert.equal(extensionBlock(ext(), 'x'), null);
  assert.match(extensionBlock(null, 'x'), /not connected/);
  assert.match(extensionBlock(ext(), 'linkedin'), /does not support/);
  assert.match(extensionBlock(ext({}, { allowed: false }), 'x'), /Allow X/);
  assert.match(extensionBlock(ext({}, { used: 5 }), 'x'), /Daily limit/);
  assert.match(extensionBlock(ext({ paused: true }), 'x'), /Paused/);
});

test('fill messages tell the person to press Post themselves', () => {
  assert.match(fillMessage({ ok: true }), /press Post yourself/);
  assert.equal(fillMessage({ ok: false, reason: 'Nope' }), 'Nope');
  assert.equal(fillMessage(null), '');
});

import { describePlanStep, planBlock, planOutcomeMessage, planPostsForYou, planStatusLabel } from './drafts.mjs';

test('plan wording is explicit about pressing Post', () => {
  assert.match(describePlanStep({ type: 'post', platform: 'x', text: 'hi', commit: true }), /press Post/);
  assert.match(describePlanStep({ type: 'post', platform: 'x', text: 'hi' }), /you press Post/);
  assert.equal(planPostsForYou({ steps: [{ type: 'post', platform: 'x', text: 'hi', commit: true }] }), true);
  assert.equal(planPostsForYou({ steps: [{ type: 'read', what: 'text' }] }), false);
  assert.equal(planStatusLabel('proposed'), 'Needs your approval');
});

test('a plan can only run when the extension is connected, not paused, and allows the posting site', () => {
  const plan = { steps: [{ type: 'post', platform: 'x', text: 'hi', commit: true }] };
  assert.match(planBlock(plan, null), /not connected/);
  assert.match(planBlock(plan, { connected: true, paused: true, platforms: {} }), /Paused/);
  assert.match(planBlock(plan, { connected: true, paused: false, platforms: { x: { label: 'X', allowed: false, cap: 5, used: 0, paused: false } } }), /Allow X/);
  assert.equal(planBlock({ steps: [{ type: 'read', what: 'text' }] }, { connected: true, paused: false, platforms: {} }), null);
  assert.match(planOutcomeMessage({ cancelled: true }), /Nothing ran/);
  assert.match(planOutcomeMessage({ ok: true, plan }), /Post was pressed/);
});
