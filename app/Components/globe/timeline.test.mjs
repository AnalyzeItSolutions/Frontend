import test from 'node:test';
import assert from 'node:assert/strict';
import { activityBuckets, advancePlayhead, bucketsFor, cursorFor, filterByTrail, peakEvent, playbackStep, stepCursor, trailForWindow, trailMs, trailsFor } from './timeline.mjs';

const H = 3_600_000;
const BASE = 1_700_000_000_000; // epoch ms (eventEpoch reads small numbers as seconds)
const bounds = { start: BASE, end: BASE + 48 * H };
const ev = (id, hours, host = 'earthquakes', mag) => ({ id, host, lat: 0, lon: 0, time: BASE + hours * H, meta: mag != null ? { mag } : {} });

test('activityBuckets counts events per slice and per layer', () => {
  const pts = [ev('a', 1), ev('b', 1.5), ev('c', 47, 'storms'), { id: 'hub', lat: 1, lon: 1 }, ev('old', -5)];
  const { buckets, max, undated } = activityBuckets(pts, bounds, 48);
  assert.equal(buckets.length, 48);
  assert.equal(buckets[1].total, 2);
  assert.equal(buckets[47].layers.storms, 1);
  assert.equal(max, 2);
  assert.equal(undated, 1); // events outside the window are dropped, undated are counted apart
});

test('an event exactly at the end lands in the last slice', () => {
  const { buckets } = activityBuckets([ev('z', 48)], bounds, 48);
  assert.equal(buckets[47].total, 1);
});

test('filterByTrail keeps the window around the cursor and undated points', () => {
  const pts = [ev('old', 1), ev('mid', 20), ev('late', 30), { id: 'hub', lat: 0, lon: 0 }];
  assert.deepEqual(filterByTrail(pts, BASE + 24 * H, null).map((p) => p.id), ['old', 'mid', 'hub']);
  assert.deepEqual(filterByTrail(pts, BASE + 24 * H, 6 * H).map((p) => p.id), ['mid', 'hub']);
  assert.equal(trailMs('6h'), 6 * H);
  assert.equal(trailMs('all'), null);
});

test('peakEvent picks the strongest, newest on a tie, and ignores unscored points', () => {
  const pts = [ev('a', 1, 'earthquakes', 5.1), ev('b', 2, 'earthquakes', 6.4), ev('c', 3, 'earthquakes', 6.4), ev('d', 4)];
  const peak = peakEvent(pts);
  assert.equal(peak.point.id, 'c');
  assert.equal(peak.score, 6.4);
  assert.equal(peakEvent([ev('x', 1)]), null);
});

test('cursor helpers stay inside 0..1', () => {
  assert.equal(cursorFor(BASE + 24 * H, bounds), 0.5);
  assert.equal(cursorFor(BASE - 10, bounds), 0);
  assert.equal(cursorFor(BASE + 99 * H, bounds), 1);
  assert.equal(stepCursor(0.5, 1, 48), 0.5208);
  assert.equal(stepCursor(0, -1, 48), 0);
  assert.equal(stepCursor(1, 1, 48), 1);
  assert.equal(playbackStep(4), 0.05);
  assert.equal(playbackStep(3), 0.0125);
});

test('each window offers trails shorter than itself and slices of a whole clock unit', () => {
  for (const days of [1, 3, 7, 14, 30]) {
    const span = days * 24 * H;
    for (const t of trailsFor(days)) assert.ok(t.ms == null || t.ms < span, `${t.id} on ${days}d`);
    const sliceHours = (days * 24) / bucketsFor(days);
    assert.ok([0.5, 1, 3, 6, 12].includes(sliceHours), `${days}d slices are ${sliceHours} h`);
  }
  assert.deepEqual(trailsFor(1).map((t) => t.id), ['all', '6h', '1h']);
  assert.equal(trailForWindow('6h', 30), 'all');
  assert.equal(trailForWindow('24h', 7), '24h');
  assert.equal(trailMs('1h'), H);
});

test('a longer window replays more slowly, and the playhead loops or stops at now', () => {
  assert.equal(playbackStep(1, 1), 0.0125);
  assert.ok(playbackStep(1, 30) < playbackStep(1, 7));
  assert.deepEqual(advancePlayhead(0.5, 0.1), { cursor: 0.6, done: false });
  assert.deepEqual(advancePlayhead(0.95, 0.1), { cursor: 1, done: true });
  assert.deepEqual(advancePlayhead(0.95, 0.1, true), { cursor: 1, done: false }); // shows "now" for a beat
  assert.deepEqual(advancePlayhead(1, 0.1, true), { cursor: 0, done: false }); // then starts over
});
