import test from 'node:test';
import assert from 'node:assert/strict';
import { isTaskFinal, pollDelayMs, stepLabel, taskControls, taskStatusText } from './computerTasks.mjs';

test('finality', () => {
  for (const s of ['done', 'failed', 'stopped', 'expired']) assert.equal(isTaskFinal(s), true);
  for (const s of ['running', 'needs_you']) assert.equal(isTaskFinal(s), false);
});

test('status wording covers each state', () => {
  assert.match(taskStatusText({ status: 'running', step_count: 1 }), /1 step so far/);
  assert.match(taskStatusText({ status: 'running', step_count: 3 }), /3 steps so far/);
  assert.match(taskStatusText({ status: 'needs_you', waiting: { kind: 'pause' } }), /sign in/);
  assert.match(taskStatusText({ status: 'needs_you', waiting: { kind: 'ask' } }), /approve a step/);
  assert.match(taskStatusText({ status: 'stopped' }), /Nothing further/);
});

test('controls: running shows only Stop', () => {
  assert.deepEqual(taskControls({ status: 'running' }), { stop: true, continue: false, approve: false, deny: false });
});

test('controls: a sign-in pause shows Continue, not approve/deny', () => {
  const c = taskControls({ status: 'needs_you', waiting: { kind: 'pause' } });
  assert.deepEqual(c, { stop: true, continue: true, approve: false, deny: false });
});

test('controls: an ask shows approve and deny, not Continue', () => {
  const c = taskControls({ status: 'needs_you', waiting: { kind: 'ask' } });
  assert.deepEqual(c, { stop: true, continue: false, approve: true, deny: true });
});

test('controls: a finished task shows nothing', () => {
  assert.deepEqual(taskControls({ status: 'done' }), { stop: false, continue: false, approve: false, deny: false });
});

test('poll delay: faster running, slower waiting, never when final', () => {
  assert.equal(pollDelayMs('running'), 1200);
  assert.equal(pollDelayMs('needs_you'), 2500);
  assert.equal(pollDelayMs('done'), 0);
});

test('step labels read as plain actions', () => {
  assert.equal(stepLabel({ action: 'navigate', detail: { url: 'https://x' } }), 'Open https://x');
  assert.equal(stepLabel({ action: 'click', detail: { target: 'Next' } }), 'Click Next');
  assert.equal(stepLabel({ action: 'type', detail: { target: 'Search' } }), 'Type into Search');
  assert.equal(stepLabel({ action: 'read' }), 'Read the page');
});
