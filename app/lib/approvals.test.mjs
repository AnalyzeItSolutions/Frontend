import test from 'node:test';
import assert from 'node:assert/strict';
import { accessHeadline, approvalPath, explainAccessError, parseApproval } from './approvals.mjs';

const ar = 'ar_' + 'a'.repeat(24);

test('parses an access request link and a change link, and nothing else', () => {
  assert.deepEqual(parseApproval(`?request=${ar}`), { kind: 'access', id: ar });
  assert.deepEqual(parseApproval('?change=0f8fad5b-d9cb-469f&project=p1'), { kind: 'change', id: '0f8fad5b-d9cb-469f', project: 'p1' });
  for (const bad of ['', '?request=abc', `?request=${ar}/..`, '?request=ar_short', '?change=abc&project=p1', '?change=0f8fad5b-d9cb-469f', '?change=0f8fad5b-d9cb-469f&project=../x', '?project=p1',
    `?change=${'x'.repeat(80)}&project=p1`, '?change=a%2Fb12345678&project=p1']) {
    assert.equal(parseApproval(bad), null, bad);
  }
});

test('round trips through approvalPath', () => {
  for (const a of [{ kind: 'access', id: ar }, { kind: 'change', id: '0f8fad5b-d9cb-469f', project: 'p1' }]) {
    assert.deepEqual(parseApproval(approvalPath(a).split('?')[1] ? `?${approvalPath(a).split('?')[1]}` : ''), a);
  }
});

test('wording', () => {
  assert.equal(accessHeadline('Claude', 2, false), 'Let Claude read 2 tables');
  assert.equal(accessHeadline('Claude', 1, false), 'Let Claude read 1 table');
  assert.match(accessHeadline('Claude', 3, true), /everything in this project/);
  assert.equal(accessHeadline('Claude', 0, false), 'Choose at least one table');
  assert.match(explainAccessError(409), /already answered/);
  assert.equal(explainAccessError(500, 'boom'), 'boom');
});
