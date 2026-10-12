import test from 'node:test';
import assert from 'node:assert/strict';
import { accessHeadline, approvalPath, dataHeadline, explainAccessError, parseApproval } from './approvals.mjs';

const ar = 'ar_' + 'a'.repeat(24);

test('parses an access request link and a change link, and nothing else', () => {
  assert.deepEqual(parseApproval(`?request=${ar}`), { kind: 'access', id: ar });
  assert.deepEqual(parseApproval(`?data=dp_${'b'.repeat(24)}`), { kind: 'data', id: `dp_${'b'.repeat(24)}` });
  for (const bad of ['?data=abc', `?data=ar_${'b'.repeat(24)}`, `?data=dp_${'b'.repeat(24)}/..`]) assert.equal(parseApproval(bad), null, bad);
  assert.deepEqual(parseApproval('?change=0f8fad5b-d9cb-469f&project=p1'), { kind: 'change', id: '0f8fad5b-d9cb-469f', project: 'p1' });
  for (const bad of ['', '?request=abc', `?request=${ar}/..`, '?request=ar_short', '?change=abc&project=p1', '?change=0f8fad5b-d9cb-469f', '?change=0f8fad5b-d9cb-469f&project=../x', '?project=p1',
    `?change=${'x'.repeat(80)}&project=p1`, '?change=a%2Fb12345678&project=p1']) {
    assert.equal(parseApproval(bad), null, bad);
  }
});

test('round trips through approvalPath', () => {
  for (const a of [{ kind: 'access', id: ar }, { kind: 'data', id: `dp_${'c'.repeat(24)}` }, { kind: 'change', id: '0f8fad5b-d9cb-469f', project: 'p1' }]) {
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

test('data headline', () => {
  assert.equal(dataHeadline('X', { rows: 3, columns: [{}, {}, {}] }), 'Add 3 rows in 3 columns as a new table');
  assert.equal(dataHeadline('X', { rows: 1, columns: [{}] }), 'Add 1 row in 1 column as a new table');
  assert.match(dataHeadline('X', { kit: 'sales_crm', name: 'Sales pipeline', rows: 120 }), /Sales pipeline.*120 rows/);
  assert.equal(dataHeadline('X', null), '');
});
