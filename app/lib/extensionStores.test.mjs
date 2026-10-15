import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BROWSER_IDS, STORES_CONFIG, chooseBrowser, detectBrowser, installSteps, readPreference, resolveBrowser, savePreference } from './extensionStores.mjs';

const UA = {
  chrome: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0',
  firefox: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:151.0) Gecko/20100101 Firefox/151.0',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  phone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
};

test('detects the browser, with Edge and Brave told apart from Chrome and phones left out', () => {
  assert.equal(detectBrowser(UA.chrome), 'chrome');
  assert.equal(detectBrowser(UA.chrome, true), 'brave');
  assert.equal(detectBrowser(UA.edge), 'edge');
  assert.equal(detectBrowser(UA.firefox), 'firefox');
  assert.equal(detectBrowser(UA.safari), 'safari');
  assert.equal(detectBrowser(UA.phone), null);
  assert.equal(detectBrowser(''), null);
});

test('every browser maps to a real store and a real package in the config', () => {
  for (const id of BROWSER_IDS) {
    const r = resolveBrowser(id);
    assert.ok(STORES_CONFIG.stores[STORES_CONFIG.browsers[id].store], id);
    assert.ok(r.packageFile, id);
    assert.ok(installSteps(r.packageKind, r.label).length >= 3);
  }
  assert.equal(resolveBrowser('netscape'), null);
});

test('placeholders mean "not yet listed"; a url means listed', () => {
  assert.equal(resolveBrowser('chrome').listed, false);
  const cfg = structuredClone(STORES_CONFIG);
  cfg.stores.chromeWebStore.url = 'https://chromewebstore.google.com/detail/x';
  assert.equal(resolveBrowser('chrome', cfg).listed, true);
  assert.equal(resolveBrowser('brave', cfg).url, 'https://chromewebstore.google.com/detail/x', 'Brave uses the Chrome store');
  assert.equal(resolveBrowser('edge', cfg).listed, false);
});

test('the chosen browser is remembered and beats detection', () => {
  const mem = new Map();
  const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  assert.equal(chooseBrowser(storage, UA.chrome), 'chrome');
  savePreference(storage, 'firefox');
  assert.equal(readPreference(storage), 'firefox');
  assert.equal(chooseBrowser(storage, UA.chrome), 'firefox');
  savePreference(storage, 'netscape');
  assert.equal(readPreference(storage), 'firefox');
  assert.equal(chooseBrowser({ getItem() { throw new Error('blocked'); } }, UA.safari), 'safari');
});

test('the config is valid JSON with versioned package names', () => {
  const raw = JSON.parse(readFileSync(new URL('../../public/extension/stores.json', import.meta.url), 'utf8'));
  for (const f of Object.values(raw.packages)) assert.ok(f.includes(raw.version), f);
});
