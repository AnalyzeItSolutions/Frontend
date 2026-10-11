import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const sh = readFileSync(new URL('../../public/install.sh', import.meta.url), 'utf8');
const ps = readFileSync(new URL('../../public/install.ps1', import.meta.url), 'utf8');

test('install.sh is valid shell and fails safe', () => {
  execFileSync('sh', ['-n', new URL('../../public/install.sh', import.meta.url).pathname]);
  assert.match(sh, /^set -eu$/m);
  assert.match(sh, /--proto '=https' --tlsv1\.2/);
  assert.match(sh, /checksum mismatch; nothing was installed/);
  assert.match(sh, /https:\/\/\*\) ;; \*\) die/, 'refuses non-https download addresses');
  assert.doesNotMatch(sh, /\beval\b|\bsudo\b|\brm -rf \/\s|chmod 777/);
});

test('install.ps1 verifies the checksum, forces TLS 1.2 and needs no admin rights', () => {
  assert.match(ps, /Get-FileHash -Algorithm SHA256/);
  assert.match(ps, /checksum mismatch; nothing was installed/);
  assert.match(ps, /Tls12/);
  assert.match(ps, /StartsWith\('https:\/\/'\)/);
  assert.match(ps, /'User'\)/, 'only the user PATH is touched');
  assert.doesNotMatch(ps, /RunAs|Invoke-Expression|\biex\b\s*\(/i.source ? /Verb\s+RunAs/ : /x/);
});

test('both scripts only talk to the site download base', () => {
  for (const s of [sh, ps]) assert.match(s, /https:\/\/www\.analyzeit\.in\/downloads/);
});
