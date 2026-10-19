import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildGrid, fieldCoordinates, renderField, sampleGrid } from './fieldImage.mjs';

const ev = (lat, lon, t) => ({ lat, lon, temperature_c: t });
const val = (e) => e.temperature_c;
// A tiny world: 2 latitudes x 4 longitudes.
const world = [ev(0, -180, 0), ev(0, -90, 10), ev(0, 0, 20), ev(0, 90, 30), ev(10, -180, 0), ev(10, -90, 10), ev(10, 0, 20), ev(10, 90, 30)];

describe('smooth field from a coarse grid', () => {
  it('returns the grid value exactly on a grid point and blends in between', () => {
    const g = buildGrid(world, val);
    assert.equal(sampleGrid(g, 0, 0), 20);
    const mid = sampleGrid(g, 0, 45);
    assert.ok(mid > 20 && mid < 30);
    assert.equal(sampleGrid(g, 0, -45), 15); // halfway between the 10 at -90 and the 20 at 0
  });

  it('wraps across the date line instead of leaving a seam', () => {
    const g = buildGrid(world, val);
    const across = sampleGrid(g, 0, 135); // between 90 (30) and the wrap to -180 (0)
    assert.ok(across > 0 && across < 30);
    assert.ok(Math.abs(sampleGrid(g, 0, 179.9) - sampleGrid(g, 0, -179.9)) < 1);
  });

  it('gives no value where there is no data', () => {
    assert.equal(sampleGrid(buildGrid([], val), 0, 0), null);
    assert.equal(sampleGrid(buildGrid([{ lat: 0, lon: 0 }], val), 0, 0), null);
  });

  it('draws only where data exists and fades at the edges', () => {
    const img = renderField({ events: world, valueOf: val, colorOf: () => '#ff0000', width: 60 });
    assert.equal(img.data.length, img.width * img.height * 4);
    const rows = img.height;
    const alphaAt = (row) => img.data[(row * img.width + 30) * 4 + 3];
    assert.ok(Math.max(...Array.from({ length: rows }, (_, r) => alphaAt(r))) > 0);
    const empty = renderField({ events: [], valueOf: val, colorOf: () => '#ff0000', width: 60 });
    assert.ok(empty.data.every((v) => v === 0));
  });

  it('the corners run clockwise from top-left over the world grid', () => {
    assert.deepEqual(fieldCoordinates(70, -50), [[-180, 70], [180, 70], [180, -50], [-180, -50]]);
  });
});
