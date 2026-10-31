import test from 'node:test';
import assert from 'node:assert/strict';
import { browserCanTranscribe, mediaKind, mixToMono, transcriptPayload, wordsToSegments } from './speechLines.mjs';

test('media kind comes from the extension', () => {
  assert.equal(mediaKind('Standup.M4A'), 'audio');
  assert.equal(mediaKind('demo.webm'), 'video');
  assert.equal(mediaKind('types.ts'), null);
  assert.equal(mediaKind('sales.csv'), null);
});

test('words become lines at pauses and after 20 seconds, like the server', () => {
  const w = (word, start, end, conf = 1) => ({ word, start, end, conf });
  const lines = wordsToSegments([w('good', 0.1, 0.4, 0.8), w('morning', 0.45, 0.9, 1), w('revenue', 2.0, 2.5), w('', 3, 3.1), w('up', 2.6, 2.8)]);
  assert.deepEqual(lines, [
    { start: 0.1, end: 0.9, text: 'good morning', confidence: 0.9 },
    { start: 2, end: 2.8, text: 'revenue up', confidence: 1 },
  ]);
  const long = Array.from({ length: 50 }, (_, i) => w('x', i * 0.5, i * 0.5 + 0.4));
  assert.ok(wordsToSegments(long).every((l) => l.end - l.start <= 20));
});

test('channels are averaged into one', () => {
  assert.deepEqual(Array.from(mixToMono([new Float32Array([1, 0]), new Float32Array([0, 1])])), [0.5, 0.5]);
});

test('a browser without the pieces or the memory is not asked to transcribe', () => {
  const ok = { webAssembly: true, offlineAudioContext: true, worker: true };
  assert.equal(browserCanTranscribe(ok).ok, true);
  assert.equal(browserCanTranscribe({ ...ok, deviceMemoryGb: 1 }).ok, false);
  assert.equal(browserCanTranscribe({ ...ok, webAssembly: false }).ok, false);
});

test('the payload has the shape the server checks', () => {
  assert.deepEqual(transcriptPayload({ segments: [], model: 'm', durationSeconds: 12.345 }),
    { engine: 'vosk', model: 'm', language: 'en', duration_seconds: 12.35, segments: [] });
});
