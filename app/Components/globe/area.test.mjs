import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { areaGeoJson, areaKm2, areaOutline, areaSummary, formatArea, pointInArea } from './area.mjs';

const india = [
  { lat: 35, lon: 68 },
  { lat: 35, lon: 90 },
  { lat: 8, lon: 90 },
  { lat: 8, lon: 68 },
];

describe('drawn area', () => {
  it('finds the pins inside, per layer', () => {
    const pts = [
      { id: 'a', host: 'flights', lat: 19.07, lon: 72.88 },
      { id: 'b', host: 'flights', lat: 28.6, lon: 77.2 },
      { id: 'c', host: 'hotspots', lat: 22, lon: 80 },
      { id: 'd', host: 'flights', lat: 51.5, lon: -0.1 },   // London: outside
    ];
    const s = areaSummary(pts, india);
    assert.deepEqual(s.inside.map((p) => p.id), ['a', 'b', 'c']);
    assert.deepEqual(s.counts, [{ layer: 'flights', count: 2 }, { layer: 'hotspots', count: 1 }]);
  });

  it('works across the date line', () => {
    const fiji = [{ lat: -15, lon: 175 }, { lat: -15, lon: -175 }, { lat: -20, lon: -175 }, { lat: -20, lon: 175 }];
    assert.equal(pointInArea({ lat: -17, lon: 179 }, fiji), true);
    assert.equal(pointInArea({ lat: -17, lon: -178 }, fiji), true);
    assert.equal(pointInArea({ lat: -17, lon: 0 }, fiji), false);
    assert.ok(areaKm2(fiji) < 700000);   // a 10x5 degree box, not the rest of the world
  });

  it('measures area close to the real thing', () => {
    // A 1x1 degree box at the equator is about 12,364 km².
    const box = [{ lat: 0, lon: 0 }, { lat: 0, lon: 1 }, { lat: 1, lon: 1 }, { lat: 1, lon: 0 }];
    assert.ok(Math.abs(areaKm2(box) - 12364) / 12364 < 0.01);
    assert.equal(formatArea(areaKm2(box)), '12,364 km²');
    assert.equal(formatArea(3.1e6), '3.1M km²');
  });

  it('exports a closed polygon and the pins with their facts', () => {
    const gj = areaGeoJson(india, [{ id: 'c', host: 'hotspots', label: '3 fire detections', lat: 22, lon: 80, meta: { 'd:Detections (24 h)': '3', other: 1 } }]);
    const ring = gj.features[0].geometry.coordinates[0];
    assert.deepEqual(ring[0], ring[ring.length - 1]);
    assert.equal(gj.features[1].properties['Detections (24 h)'], '3');
    assert.equal(gj.features[1].properties.other, undefined);
    assert.deepEqual(areaOutline(india, true).length, 5);
    assert.deepEqual(areaOutline(india, false).length, 4);
  });

  it('needs three corners', () => {
    assert.equal(pointInArea({ lat: 0, lon: 0 }, [{ lat: 0, lon: 0 }, { lat: 1, lon: 1 }]), false);
    assert.equal(areaKm2([]), 0);
  });
});
