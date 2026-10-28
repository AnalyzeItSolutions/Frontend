import test from 'node:test';
import assert from 'node:assert/strict';
import {
  draftFromParams, draftProblems, explainActionError, isFinal, looksLikeSecret, paramsFromDraft, safeLink, sameParams, statusText,
  isPlanFinal, planRisk, planStatusText, splitStepRefs, stepStatusText,
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

test('plan status wording says what ran and what was never sent', () => {
  const steps = [{ n: 1, status: 'done' }, { n: 2, status: 'failed' }, { n: 3, status: 'skipped' }];
  assert.match(planStatusText('failed', steps), /Stopped at step 2\. 1 of 3 done; later steps were not sent/);
  assert.equal(planStatusText('pending', steps), 'Waiting for your approval (3 steps)');
  assert.equal(planStatusText('done', steps), 'All 3 steps done');
  assert.match(planStatusText('denied', steps), /Nothing was sent/);
  assert.equal(stepStatusText('skipped'), 'Not run');
  assert.equal(isPlanFinal('running'), false);
  assert.equal(isPlanFinal('cancelled'), true);
});

test('plan risk is the highest step risk', () => {
  assert.equal(planRisk([{ risk: 'low' }, { risk: 'medium' }]), 'medium');
  assert.equal(planRisk([{ risk: 'low' }, { risk: 'high' }]), 'high');
  assert.equal(planRisk([]), 'low');
});

test('references to earlier steps are found in text', () => {
  assert.deepEqual(splitStepRefs('Pay here: {{step 1.url}} thanks'), [
    { text: 'Pay here: ' },
    { ref: { step: 1, key: 'url' }, text: '{{step 1.url}}' },
    { text: ' thanks' },
  ]);
  assert.deepEqual(splitStepRefs('plain'), [{ text: 'plain' }]);
  assert.deepEqual(splitStepRefs(42), [{ text: '42' }]);
});
