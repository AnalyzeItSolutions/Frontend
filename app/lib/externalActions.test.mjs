import test from 'node:test';
import assert from 'node:assert/strict';
import {
  draftFromParams, draftProblems, explainActionError, isFinal, looksLikeSecret, paramsFromDraft, safeLink, sameParams, statusText,
} from './externalActions.mjs';

const fields = [
  { name: 'repo', label: 'Repository', kind: 'text', required: true, max_len: 20, choices: [], help: '' },
  { name: 'number', label: 'Number', kind: 'int', required: true, max_len: 12, choices: [], help: '' },
  { name: 'body', label: 'Comment', kind: 'longtext', required: false, max_len: 10, choices: [], help: '' },
];

test('draft round trip keeps numbers as numbers and drops empty optional fields', () => {
  const d = draftFromParams(fields, { repo: 'a/b', number: 7 });
  assert.deepEqual(d, { repo: 'a/b', number: '7', body: '' });
  assert.deepEqual(paramsFromDraft(fields, d), { repo: 'a/b', number: 7 });
  assert.deepEqual(paramsFromDraft(fields, { ...d, body: 'hi' }), { repo: 'a/b', number: 7, body: 'hi' });
});

test('an emptied required field is sent as empty so the server refuses it', () => {
  assert.equal(paramsFromDraft(fields, { repo: '', number: '1', body: '' }).repo, '');
});

test('problems: required, too long, not a number', () => {
  assert.deepEqual(draftProblems(fields, { repo: 'a/b', number: '3', body: '' }), {});
  const p = draftProblems(fields, { repo: '', number: 'x', body: 'x'.repeat(11) });
  assert.match(p.repo, /required/);
  assert.match(p.number, /number/);
  assert.match(p.body, /11 of 10/);
});

test('sameParams compares by field text', () => {
  assert.equal(sameParams(fields, { repo: 'a/b', number: 1 }, { repo: 'a/b', number: '1' }), true);
  assert.equal(sameParams(fields, { repo: 'a/b', number: 1 }, { repo: 'a/c', number: 1 }), false);
});

test('only plain https links are shown', () => {
  assert.equal(safeLink('https://github.com/a/b'), 'https://github.com/a/b');
  for (const bad of ['javascript:alert(1)', 'http://x.com', 'https://u:p@x.com', 'data:text/html,x', '', null, 'not a url']) assert.equal(safeLink(bad), null, String(bad));
});

test('messages that carry a login are caught, ordinary ones are not', () => {
  const secrets = [
    'my token is ghp_' + 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4',
    'github_pat_' + 'Zy9Xw8Vu7Ts6Rq5Po4Nm3Lk2',
    'use sk_live_' + 'abcdefgh12345678',
    'xoxb-1234567890-abcdefghij',
    '123456789:AAH' + 'x'.repeat(32),
    'https://discord.com/api/webhooks/123456789012345678/AbCdEfGhIjKlMn',
    'password: hunter2hunter2',
    'the api key = abcdef123456',
    '-----BEGIN RSA PRIVATE KEY-----',
    'Authorization: Bearer ' + 'a'.repeat(30),
  ];
  for (const s of secrets) assert.equal(looksLikeSecret(s), true, s);
  const fine = ['post "ship it" on bluesky', 'follow octocat on github', 'how do I reset my password?', 'what is an API key', 'Download https://example.com/report.pdf', 'tokens per second'];
  for (const s of fine) assert.equal(looksLikeSecret(s), false, s);
});

test('status text and finality', () => {
  assert.equal(isFinal('pending'), false);
  assert.equal(isFinal('running'), false);
  for (const s of ['done', 'failed', 'denied', 'cancelled', 'expired']) assert.equal(isFinal(s), true);
  assert.match(statusText('denied'), /Nothing was sent/);
});

test('error wording', () => {
  assert.match(explainActionError(409), /changed/);
  assert.match(explainActionError(429), /minute/);
  assert.equal(explainActionError(500, 'Boom'), 'Boom');
});
