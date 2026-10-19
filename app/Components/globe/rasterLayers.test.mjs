import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { activeRasters, radarRaster, satelliteRasters } from './rasterLayers.mjs';

const index = { host: 'https://tilecache.rainviewer.com', radar: { past: [{ time: 1, path: '/v2/radar/old' }, { time: 2, path: '/v2/radar/new' }] } };

describe('live raster layers', () => {
  it('uses the newest radar frame', () => {
    const r = radarRaster(index);
    assert.equal(r.tiles[0], 'https://tilecache.rainviewer.com/v2/radar/new/256/{z}/{x}/{y}/2/1_1.png');
    assert.equal(r.time, 2);
  });

  it('draws no radar when the index is missing, empty, or not https', () => {
    assert.equal(radarRaster(null), null);
    assert.equal(radarRaster({ host: 'https://x.test', radar: { past: [] } }), null);
    assert.equal(radarRaster({ host: 'http://x.test', radar: { past: [{ time: 1, path: '/a' }] } }), null);
    assert.equal(radarRaster({ host: 'https://x.test', radar: { past: [{ time: 1, path: 'javascript:alert(1)' }] } }), null);
  });

  it('satellite imagery comes from NASA GIBS with the right tile order (row = y, column = x)', () => {
    for (const r of satelliteRasters()) {
      assert.match(r.tiles[0], /^https:\/\/gibs\.earthdata\.nasa\.gov\/wmts\/epsg3857\/best\/.+\/\{z\}\/\{y\}\/\{x\}\.png$/);
    }
  });

  it('only the toggled layers are drawn, satellite under radar', () => {
    assert.deepEqual(activeRasters({}, index), []);
    assert.deepEqual(activeRasters({ radar: true }, index).map((r) => r.id), ['radar']);
    assert.deepEqual(activeRasters({ clouds: true, radar: true }, index).map((r) => r.id), ['goes-east', 'himawari', 'radar']);
    assert.deepEqual(activeRasters({ radar: true }, null), []);
  });
});
