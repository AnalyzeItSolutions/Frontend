import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { aqiColor, magnitudeColor, temperatureColor, valueColor } from './pinColors.mjs';

describe('pin colour scales', () => {
  it('temperature runs from violet through blue and yellow to red, clamped at both ends', () => {
    assert.equal(temperatureColor(-50), '#4c1d95');
    assert.equal(temperatureColor(0), '#38bdf8');
    assert.equal(temperatureColor(20), '#facc15');
    assert.equal(temperatureColor(60), '#dc2626');
    assert.notEqual(temperatureColor(25), temperatureColor(20));
  });

  it('air quality follows the standard AQI bands', () => {
    assert.equal(aqiColor(30), '#22c55e');
    assert.equal(aqiColor(120), '#f97316');
    assert.equal(aqiColor(400), '#7f1d1d');
  });

  it('earthquakes darken with magnitude', () => {
    assert.deepEqual([3, 4.5, 5.5, 7].map(magnitudeColor), ['#fbbf24', '#f59e0b', '#ea580c', '#dc2626']);
  });

  it('a missing number gives no colour, so the layer colour is used rather than a made-up one', () => {
    assert.equal(temperatureColor(null), null);
    assert.equal(aqiColor(undefined), null);
    assert.equal(valueColor('weather', {}), null);
    assert.equal(valueColor('wildfires', { temperature_c: 30 }), null);
    assert.equal(valueColor('weather', { temperature_c: 0 }), '#38bdf8');
  });
});
