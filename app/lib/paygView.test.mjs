import test from 'node:test';
import assert from 'node:assert/strict';
import { capProblem, invoiceLine, paygStatusLine, planLimitLines, rateLine, usd } from './paygView.mjs';

const on = { enabled: true, suspended: false, cap_usd: 10, max_cap_usd: 50, remaining_usd: 6.5, spent_this_month_usd: 3.5, usd_per_million_tokens: 2 };

test('money reads plainly', () => {
  assert.equal(usd(3.456), '$3.46');
  assert.equal(usd(0.004), '<$0.01');
  assert.equal(usd(0), '$0.00');
  assert.equal(usd('x'), '$0.00');
});

test('the status says what state it is in and what to do', () => {
  assert.match(paygStatusLine({ ...on, enabled: false }), /^Off\./);
  assert.match(paygStatusLine(on), /\$3\.50 used of your \$10\.00 cap/);
  assert.match(paygStatusLine({ ...on, remaining_usd: 0 }), /reached this month/);
  assert.match(paygStatusLine({ ...on, suspended: true }), /Paused: an invoice is overdue/);
  assert.equal(paygStatusLine(null), '');
});

test('the rate is stated with an example', () => {
  assert.match(rateLine(on), /\$2\.00 per million tokens/);
  assert.match(rateLine(on), /about 200 typical answers per dollar/);
});

test('invoices say what they cover and whether they are paid', () => {
  assert.equal(invoiceLine({ months: ['2026-10'], amount_usd: 4, status: 'paid' }), '2026-10: $4.00, paid');
  assert.match(invoiceLine({ months: ['2026-10'], amount_usd: 4, amount: 332, currency: 'INR', status: 'overdue' }), /INR 332, overdue/);
  assert.match(invoiceLine({ months: ['2026-09', '2026-10'], amount_usd: 1.2, status: 'issued' }), /waiting for payment/);
});

test('the cap is checked against the floor and the ceiling', () => {
  assert.equal(capProblem(20, on), '');
  assert.match(capProblem(0.5, on), /at least \$1/);
  assert.match(capProblem(80, on), /up to \$50\.00/);
  assert.match(capProblem('abc', on), /number/);
});

test('plugin limits are listed in words', () => {
  const lines = planLimitLines({ calls_per_day: 300, calls_per_minute: 30, rows_per_call: 50, rows_per_day: 5000, writes_per_day: 20 }, 'Free');
  assert.equal(lines.length, 3);
  assert.match(lines[0], /300 calls a day \(30 a minute\)/);
  assert.deepEqual(planLimitLines(null, 'Free'), []);
});
