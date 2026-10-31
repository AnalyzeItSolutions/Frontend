import test, { describe, it } from 'node:test';
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

describe('world layers in chat', () => {
  it('maps world questions to the new layers', () => {
    assert.deepEqual(inferGlobeLayers('How busy is air traffic over Europe right now?'), ['flights']);
    assert.deepEqual(inferGlobeLayers('Which cities are in the news today?'), ['news_events']);
    assert.deepEqual(inferGlobeLayers('Where is the jet stream?'), ['wind']);
    assert.deepEqual(inferGlobeLayers('Show active fires burning in Brazil'), ['wildfires', 'hotspots']);
  });

  it('leaves business questions alone', () => {
    assert.deepEqual(inferGlobeLayers("What's happening with my sales this week?"), []);
    assert.deepEqual(inferGlobeLayers('Which products had the most refunds?'), []);
  });
});
