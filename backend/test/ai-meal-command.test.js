const assert = require('node:assert/strict');
const test = require('node:test');

const {
  calculateBillableMealCount,
  expandMealDateRange,
} = require('../dist/app/module/ai-automation/ai-meal-command');

test('weights spoken breakfast quantities at one half meal each', () => {
  assert.equal(calculateBillableMealCount('BREAKFAST', 1), 0.5);
  assert.equal(calculateBillableMealCount('BREAKFAST', 2), 1);
  assert.equal(calculateBillableMealCount('BREAKFAST', 3), 1.5);
});

test('keeps lunch and dinner quantities at one meal each', () => {
  assert.equal(calculateBillableMealCount('LUNCH', 1), 1);
  assert.equal(calculateBillableMealCount('LUNCH', 2), 2);
  assert.equal(calculateBillableMealCount('DINNER', 3), 3);
  assert.equal(calculateBillableMealCount('DINNER', 3, 'OFF'), 0);
});

test('expands inclusive meal date ranges across month boundaries', () => {
  assert.deepEqual(expandMealDateRange('2026-08-30', '2026-09-03'), [
    '2026-08-30',
    '2026-08-31',
    '2026-09-01',
    '2026-09-02',
    '2026-09-03',
  ]);
  assert.deepEqual(expandMealDateRange('2026-08-10'), ['2026-08-10']);
});

test('rejects invalid or backwards meal date ranges', () => {
  assert.throws(
    () => expandMealDateRange('2026-08-11', '2026-08-10'),
    /cannot be before/,
  );
  assert.throws(() => expandMealDateRange('not-a-date'), /YYYY-MM-DD/);
});
