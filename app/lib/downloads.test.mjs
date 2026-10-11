import test from 'node:test';
import assert from 'node:assert/strict';
import { blobUrl, detectArch, detectOs, filesFor, isSafeFilePath, isValidManifest, primaryFile } from './downloads.mjs';

const releases = {
  desktop: {
    version: '0.3.0',
    files: [
      { os: 'macos', arch: 'arm64', kind: 'dmg', name: 'a_aarch64.dmg', url: '/x', sha256: 'a'.repeat(64), size: 9e6 },
      { os: 'macos', arch: 'x64', kind: 'dmg', name: 'a_x64.dmg', url: '/x', sha256: 'b'.repeat(64), size: 9e6 },
      { os: 'macos', arch: 'arm64', kind: 'app-update', name: 'u.tar.gz', url: '/x', sha256: 'c'.repeat(64), size: 9e6 },
      { os: 'windows', arch: 'x64', kind: 'msi', name: 'a.msi', url: '/x', sha256: 'd'.repeat(64), size: 9e6 },
      { os: 'windows', arch: 'x64', kind: 'exe', name: 'a-setup.exe', url: '/x', sha256: 'e'.repeat(64), size: 9e6 },
      { os: 'linux', arch: 'x64', kind: 'deb', name: 'a.deb', url: '/x', sha256: 'f'.repeat(64), size: 9e6 },
      { os: 'linux', arch: 'x64', kind: 'appimage', name: 'a.AppImage', url: '/x', sha256: '1'.repeat(64), size: 9e6 },
    ],
  },
  cli: { version: '0.3.0', files: [{ os: 'linux', arch: 'x64', kind: 'binary', name: 'analyzeit_linux-x64', url: '/x', sha256: '2'.repeat(64), size: 5e6 }] },
};

test('detects the visitor’s system', () => {
  assert.equal(detectOs('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit', 'MacIntel'), 'macos');
  assert.equal(detectOs('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Win32'), 'windows');
  assert.equal(detectOs('Mozilla/5.0 (X11; Linux x86_64)', 'Linux x86_64'), 'linux');
  assert.equal(detectOs('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 'iPhone'), null);
  assert.equal(detectOs('Mozilla/5.0 (Linux; Android 14)', 'Linux armv81'), null);
  assert.equal(detectOs('', ''), null);
});

test('Macs default to Apple silicon unless the browser reports Intel', () => {
  assert.equal(detectArch('macos', ''), 'arm64');
  assert.equal(detectArch('macos', 'x86'), 'x64');
  assert.equal(detectArch('windows', 'arm'), 'x64');
});

test('picks the right installers and hides update bundles', () => {
  assert.deepEqual(filesFor(releases, 'desktop', 'macos', 'arm64').map((f) => f.name), ['a_aarch64.dmg']);
  assert.deepEqual(filesFor(releases, 'desktop', 'macos', 'x64').map((f) => f.name), ['a_x64.dmg']);
  assert.equal(primaryFile(releases, 'desktop', 'windows', 'x64').name, 'a-setup.exe');
  assert.equal(primaryFile(releases, 'desktop', 'linux', 'x64').name, 'a.AppImage');
  assert.equal(primaryFile(releases, 'cli', 'linux', 'x64').name, 'analyzeit_linux-x64');
  assert.equal(primaryFile(releases, 'cli', 'windows', 'x64'), null);
  assert.deepEqual(filesFor({}, 'desktop', 'macos', 'arm64'), []);
});

test('only product/version/file paths are served', () => {
  assert.equal(isSafeFilePath(['desktop', '0.3.0', 'AnalyzeIt_0.3.0_aarch64.dmg']), true);
  assert.equal(isSafeFilePath(['cli', '1.12.3', 'analyzeit_linux-x64']), true);
  for (const bad of [
    ['desktop', '0.3.0'], ['desktop', '0.3.0', 'a', 'b'], ['evil', '0.3.0', 'a'], ['desktop', 'latest', 'a'], ['desktop', '0.3.0', '../x'],
    ['desktop', '0.3.0', '..'], ['desktop', '0.3.0', '.hidden'], ['desktop', '0.3.0', 'a/b'], ['desktop', '0.3.0', 'a%2fb'], ['desktop', '0.3.0', 'a b'],
    ['desktop', '0.3.0', 'https://evil.example/x'], ['desktop', '0.3.0', ''], 'desktop/0.3.0/x', null,
  ]) assert.equal(isSafeFilePath(bad), false, JSON.stringify(bad));
});

test('blob URLs stay inside the downloads container', () => {
  assert.match(blobUrl(['desktop', '0.3.0', 'a.dmg']), /^https:\/\/[^/]+\/downloads\/desktop\/0\.3\.0\/a\.dmg$/);
});

test('manifests must be signed, versioned and https', () => {
  const ok = { version: '0.3.0', platforms: { 'darwin-aarch64': { url: 'https://analyzeit.in/downloads/files/desktop/0.3.0/x', signature: 'x'.repeat(40) } } };
  assert.equal(isValidManifest(ok), true);
  assert.equal(isValidManifest({ ...ok, version: 'latest' }), false);
  assert.equal(isValidManifest({ ...ok, platforms: { a: { url: 'http://x/y', signature: 'x'.repeat(40) } } }), false);
  assert.equal(isValidManifest({ ...ok, platforms: { a: { url: 'https://x/y', signature: '' } } }), false);
  assert.equal(isValidManifest(null), false);
  assert.equal(isValidManifest({ version: '1.0.0' }), false);
});
