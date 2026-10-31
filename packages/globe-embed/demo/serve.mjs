#!/usr/bin/env node
/** Demo server: serves the package folder and forwards /v1/geo/events to a local Backend (never production). */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const api = process.env.GLOBE_API || 'http://127.0.0.1:8000';
const port = Number(process.env.PORT || 5180);
const types = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.geojson': 'application/json', '.json': 'application/json' };

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/v1/geo/events') {
    const up = await fetch(api + url.pathname + url.search).catch(() => null);
    res.writeHead(up ? up.status : 502, { 'content-type': 'application/json' });
    return res.end(up ? Buffer.from(await up.arrayBuffer()) : '{}');
  }
  const path = normalize(join(root, url.pathname === '/' ? 'demo/index.html' : url.pathname));
  if (!path.startsWith(root)) return res.writeHead(403).end();
  try {
    const body = await readFile(path);
    res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(port, '127.0.0.1', () => console.log(`globe demo on http://127.0.0.1:${port}`));
