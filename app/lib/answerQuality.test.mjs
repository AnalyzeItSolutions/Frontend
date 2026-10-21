import test from 'node:test';
import assert from 'node:assert/strict';
import { looksCutOff } from './answerQuality.mjs';

const body = 'France exports aerospace, luxury goods and wine to many partners across the world. '.repeat(3);

test('an answer that stops on a function word or a dangling mark is cut off', () => {
  assert.equal(looksCutOff(`${body}\n\n- Main trade partners: Germany, Italy, Spain, Belgium, the Netherlands (EU); the`), true);
  assert.equal(looksCutOff(`${body} The deficit is,`), true);
  assert.equal(looksCutOff(`${body} The main risks are:`), true);
});

test('the fact-check note appended after the model text does not hide a cut', () => {
  assert.equal(looksCutOff(`${body}\n\n- Main trade partners: Germany and the\n\nNote: I couldn't match some figures above (169.6 billion) to the data I retrieved.`), true);
});

test('finished answers, short replies, tables and lists are left alone', () => {
  assert.equal(looksCutOff(`${body}That is the whole picture.`), false);
  assert.equal(looksCutOff(`${body}\n\n- Revenue growth: +3.1%\n- Public debt: 113.0%`), false);
  assert.equal(looksCutOff(`${body}\n\n| Metric | 2024 |\n| Debt | 113.0% |`), false);
  assert.equal(looksCutOff('Sure, and the'), false);
  assert.equal(looksCutOff(''), false);
});
