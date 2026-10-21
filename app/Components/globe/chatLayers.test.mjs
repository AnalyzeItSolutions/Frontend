import test from 'node:test';
import assert from 'node:assert/strict';
import { inferGlobeLayers } from './chatLayers.mjs';

test('picks the layer a question is about', () => {
  assert.deepEqual(inferGlobeLayers('Any earthquakes near Japan today?'), ['earthquakes']);
  assert.deepEqual(inferGlobeLayers('How bad is the air quality in Delhi?'), ['air_quality']);
  assert.deepEqual(inferGlobeLayers('Where are wildfires and storms right now'), ['wildfires', 'storms']);
});

test('caps the number of layers and ignores ordinary questions', () => {
  assert.equal(inferGlobeLayers('earthquake storm volcano flood weather', 2).length, 2);
  assert.deepEqual(inferGlobeLayers('Summarise the key takeaways in three bullets'), []);
  assert.deepEqual(inferGlobeLayers(''), []);
});

test('does not match inside other words', () => {
  assert.deepEqual(inferGlobeLayers('The brainstorm session was in a restaurant'), []);
});
