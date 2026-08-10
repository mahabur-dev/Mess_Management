import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildCommandNormalization,
  inferExpenseCategory,
  normalizeCommandText,
} from './command-normaliser';

const normalizationCases: Array<[string, string]> = [
  ['agke bazar 400tk add kro', 'today bazar 400 taka add'],
  ['alu 2kg 100 taka add koro', 'alu 2 kg 100 taka add'],
  ['alu 2 kg 100 taka, piaus 2kg 100 taka', 'alu 2 kg 100 taka, piyaj 2 kg 100 taka'],
  ['i had purchased 2kg alu 100 tk', 'i had purchased 2 kg alu 100 taka'],
  ['আজকে বাজার ৪০০ টাকা', 'today বাজার 400 taka'],
  ['২ কেজি আলু ১০০ টাকা কিনেছি', '2 kg আলু 100 taka কিনেছি'],
];

test('normalizes supported Bangla, Banglish and mixed-language commands', () => {
  for (const [input, expected] of normalizationCases) {
    assert.equal(normalizeCommandText(input), expected);
  }
});

test('detects grocery hints for multi-item Banglish input', () => {
  const result = buildCommandNormalization('alu 2 kg 100 taka, piaus 2kg 100 taka');
  assert.equal(result.hints.expenseCategory, 'GROCERY');
  assert.equal(result.hints.hasMoney, true);
  assert.equal(result.hints.hasQuantity, true);
});

test('infers common categories', () => {
  assert.equal(inferExpenseCategory('alu', null), 'GROCERY');
  assert.equal(inferExpenseCategory(null, 'restaurant dinner 500 taka'), 'FOOD');
  assert.equal(inferExpenseCategory(null, 'electricity bill 1200'), 'ELECTRICITY');
});
