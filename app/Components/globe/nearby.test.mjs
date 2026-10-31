import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { distanceKm, nearMyPlaces } from './nearby.mjs';

describe('near my places', () => {
  const warehouse = { id: 'my_data:w1', host: 'my_data', label: 'Mumbai warehouse', lat: 19.07, lon: 72.88 };
  const office = { id: 'my_data:o1', host: 'my_data', label: 'London office', lat: 51.5, lon: -0.12 };

  it('lists what is within each layer’s reach, nearest first', () => {
    const pts = [
      warehouse, office,
      { id: 'news_events:1', host: 'news_events', label: 'Mumbai', lat: 19.08, lon: 72.88 },          // ~1 km
      { id: 'hotspots:1', host: 'hotspots', label: '3 fire detections', lat: 19.5, lon: 73.0 },        // ~49 km
      { id: 'hotspots:2', host: 'hotspots', label: 'far fire', lat: 20.5, lon: 73.5 },                 // ~170 km: past 50 km
      { id: 'earthquakes:1', host: 'earthquakes', label: 'M4.1', lat: 21.0, lon: 73.0 },               // ~215 km: inside 300
      { id: 'flights:1', host: 'flights', label: 'AIC1', lat: 19.07, lon: 72.88 },                     // flights never count
    ];
    const out = nearMyPlaces(pts);
    assert.equal(out.length, 1);
    assert.equal(out[0].place.label, 'Mumbai warehouse');
    assert.deepEqual(out[0].near.map((n) => n.point.id), ['news_events:1', 'hotspots:1', 'earthquakes:1']);
    assert.equal(out[0].total, 3);
  });

  it('is empty without your places or without world pins', () => {
    assert.deepEqual(nearMyPlaces([warehouse]), []);
    assert.deepEqual(nearMyPlaces([{ id: 'earthquakes:1', host: 'earthquakes', lat: 0, lon: 0 }]), []);
  });

  it('measures great-circle distance', () => {
    assert.ok(Math.abs(distanceKm({ lat: 51.5, lon: -0.12 }, { lat: 48.86, lon: 2.35 }) - 343) < 5);   // London–Paris
  });
});
