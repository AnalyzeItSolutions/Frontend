#!/usr/bin/env node
/**
 * Build the embeddable globe into dist/:
 *   analyzeit-globe.mjs      the module (MapLibre bundled in), exports createGlobe, mountGlobeApp, EMBED_LAYERS
 *   maplibre-gl-worker.mjs   MapLibre's worker, loaded from the same folder (no blob: workers, so strict CSPs work)
 *   analyzeit-globe.css      the screen's styles plus MapLibre's own
 *   world-110m.geojson       Natural Earth countries (public domain), the offline base map
 * Then `node build.mjs --sync` copies dist/ into the desktop app and the extension.
 */
import { build } from 'esbuild';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const frontend = join(here, '..', '..');
const dist = join(here, 'dist');
const require = createRequire(join(frontend, 'package.json'));
mkdirSync(dist, { recursive: true });

await build({
  entryPoints: [join(here, 'src', 'index.mjs')],
  bundle: true,
  format: 'esm',
  // MapLibre's main thread and worker find classes by name when they pass data, so names must survive minifying.
  minify: true,
  keepNames: true,
  target: 'es2022',
  outfile: join(dist, 'analyzeit-globe.mjs'),
  nodePaths: [join(frontend, 'node_modules')],
  legalComments: 'eof',
  logLevel: 'warning',
});

const maplibreDist = dirname(require.resolve('maplibre-gl/dist/maplibre-gl.mjs'));
copyFileSync(join(maplibreDist, 'maplibre-gl-worker.mjs'), join(dist, 'maplibre-gl-worker.mjs'));
writeFileSync(
  join(dist, 'analyzeit-globe.css'),
  readFileSync(join(maplibreDist, 'maplibre-gl.css'), 'utf8') + '\n' + readFileSync(join(here, 'src', 'globe.css'), 'utf8'),
);

const { feature } = require('topojson-client');
const topo = JSON.parse(readFileSync(require.resolve('world-atlas/countries-110m.json'), 'utf8'));
const round = (v) => (Array.isArray(v) ? v.map(round) : Math.round(v * 1000) / 1000);
const world = feature(topo, topo.objects.countries);
for (const f of world.features) {
  f.geometry.coordinates = round(f.geometry.coordinates);
  f.properties = {};
}
writeFileSync(join(dist, 'world-110m.geojson'), JSON.stringify(world));
console.log('[globe-embed] built', ['analyzeit-globe.mjs', 'maplibre-gl-worker.mjs', 'analyzeit-globe.css', 'world-110m.geojson'].join(', '));

if (process.argv.includes('--sync')) {
  const targets = [
    join(frontend, '..', 'native', 'desktop', 'ui', 'vendor', 'globe'),
    join(frontend, '..', 'extension', 'src', 'vendor', 'globe'),
  ];
  for (const t of targets) {
    if (!existsSync(dirname(dirname(t)))) continue;
    mkdirSync(t, { recursive: true });
    for (const f of ['analyzeit-globe.mjs', 'maplibre-gl-worker.mjs', 'analyzeit-globe.css', 'world-110m.geojson']) copyFileSync(join(dist, f), join(t, f));
    console.log('[globe-embed] synced to', t);
  }
}
