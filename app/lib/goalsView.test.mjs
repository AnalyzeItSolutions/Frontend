import test from 'node:test';
import assert from 'node:assert/strict';
import { changeLine, everyLabel, goalStatusLine, reconcileSummary, runGoalMessage } from './goalsView.mjs';

test('a goal says what state it is in', () => {
  assert.equal(goalStatusLine({ enabled: false }), 'Paused.');
  assert.match(goalStatusLine({ enabled: true, every: 'daily', last_status: null }), /every day\. Not run yet/);
  assert.match(goalStatusLine({ enabled: true, every: 'weekly', last_status: 'needs_ai_access' }), /not allowed to read/);
  assert.match(goalStatusLine({ enabled: true, every: 'monthly', last_status: 'failed' }), /tried again/);
  assert.equal(goalStatusLine(null), '');
  assert.equal(everyLabel('nope'), 'every week');
});

test('change between runs is counted', () => {
  assert.equal(changeLine({ new: [], gone: [] }), 'Nothing changed since the run before.');
  assert.equal(changeLine({ new: ['a', 'b'], gone: ['c'] }), '2 new, 1 no longer showing.');
  assert.equal(changeLine(undefined), 'Nothing changed since the run before.');
});

test('reconcile says what it did and did not check', () => {
  assert.equal(reconcileSummary({ checked: { payments: 0, refunds: 0 }, findings: [], clean: true, not_checked: [] }), 'No synced payments to check yet.');
  const clean = reconcileSummary({ checked: { payments: 10, refunds: 2 }, findings: [], clean: true, not_checked: ['orders', 'settlements'] });
  assert.match(clean, /Everything adds up/);
  assert.match(clean, /orders and settlements/);
  assert.match(reconcileSummary({ checked: { payments: 10, refunds: 2 }, findings: [{}], clean: false, not_checked: [] }), /1 thing to look at/);
});

test('running now answers every outcome', () => {
  assert.match(runGoalMessage({ status: 'ok' }), /Ran it/);
  assert.match(runGoalMessage({ status: 'needs_ai_access' }), /Allow the assistant/);
  assert.match(runGoalMessage(null, { status: 429 }), /last hour/);
  assert.match(runGoalMessage({ status: 'failed' }), /Try again/);
  assert.match(runGoalMessage({ status: 'no_data' }), /automatic checks/);
});
