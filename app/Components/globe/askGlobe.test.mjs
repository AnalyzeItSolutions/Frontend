import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { activeLayerSummary, askSuggestions, clampAnswer, flyTargetFromText, globeAskMessage, placesFromText, stripGlobeEcho } from './askGlobe.mjs';

const state = {
  selected: { lat: 19.07, lon: 72.87, name: 'Mumbai', country: 'India' },
  compare: [{ lat: 19.07, lon: 72.87, name: 'Mumbai' }, { lat: 51.5, lon: -0.12, name: 'London' }],
  layers: { earthquakes: true, wildfires: false, my_data: true, markets: true },
  layerCounts: { earthquakes: 120, my_data: 7, markets: 0 },
  days: 3,
};

describe('Ask the globe context', () => {
  it('lists only layers that are on and have pins', () => {
    assert.deepEqual(activeLayerSummary(state.layers, state.layerCounts).map((l) => l.id), ['earthquakes', 'my_data']);
  });

  it('describes the view and pins places once each', () => {
    const msg = globeAskMessage('What is happening here?', state);
    assert.match(msg, /^What is happening here\?/);
    assert.match(msg, /Mumbai, India @ 19\.0700, 72\.8700/);
    assert.equal((msg.match(/Mumbai/g) || []).length, 1);
    assert.match(msg, /London/);
    assert.match(msg, /Earthquakes \(120\), My data \(7\), last 3 days/);
    assert.match(msg, /own project records/);
    assert.match(msg, /fly to them/);
  });

  it('works with nothing selected', () => {
    const msg = globeAskMessage('', { layers: {}, layerCounts: {} });
    assert.match(msg, /^What should I look at/);
    assert.doesNotMatch(msg, /Layers on the map/);
  });
});

describe('suggestions', () => {
  it('follow the selection and layers, max 4', () => {
    const s = askSuggestions(state);
    assert.ok(s.length <= 4);
    assert.match(s[0], /^Compare Mumbai and London/);
    assert.ok(s.some((x) => /earthquakes/.test(x)));
  });

  it('offer defaults on an empty globe', () => {
    assert.ok(askSuggestions({}).length >= 2);
  });
});

describe('clampAnswer', () => {
  it('truncates only very long text', () => {
    assert.equal(clampAnswer('short'), 'short');
    assert.ok(clampAnswer('x'.repeat(7000)).length <= 6001);
  });
});

describe('Ask the globe answers without place pins', () => {
  const answer =
    '**Valdivia earthquake**, which struck **Chile** on May 22, 1960.\n\n' +
    '- **Epicenter:** Near **Valdivia, Chile** (approximately 39.5°S, 74.5°W)\n\n' +
    '[Globe view] Please fly to **Valdivia, Chile** (39.5°S, 74.5°W) — the epicenter.';

  it('drops the echoed globe note from the answer', () => {
    const shown = stripGlobeEcho(answer);
    assert.doesNotMatch(shown, /Globe view|Please fly/);
    assert.match(shown, /Epicenter/);
  });

  it('reads places written with coordinates, once each', () => {
    assert.deepEqual(placesFromText(answer), [{ name: 'Valdivia, Chile', lat: -39.5, lon: -74.5 }]);
    assert.deepEqual(
      placesFromText('Tokyo (35.68, 139.69) and Paris (48.85°N, 2.35°E)').map((p) => p.name),
      ['Tokyo', 'Paris'],
    );
  });

  it('ignores number pairs that are not coordinates', () => {
    assert.deepEqual(placesFromText('in 1960 (May 22, 1960) and (5, 10) or (120°N, 10°E)'), []);
  });

  it('finds the place to fly to by name', () => {
    assert.equal(flyTargetFromText(answer), 'Valdivia, Chile');
    assert.equal(flyTargetFromText('No places here.'), null);
  });
});

describe('starter questions for a selected live pin', () => {
  it('asks about the pin, not "what is happening in 9 fire detections"', () => {
    const qs = askSuggestions({ selected: { lat: -17.5, lon: 23.5, name: '9 fire detections' }, selectedIsEvent: true });
    assert.equal(qs[0], 'What should I know about “9 fire detections” at -17.50, 23.50?');
    assert.ok(!qs.some((q) => q.includes('happening in 9 fire')));
  });
});
