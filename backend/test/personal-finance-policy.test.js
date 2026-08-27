const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
  calculatePersonalSummary,
  isPersonalCategoryAllowed,
  personalMonthRange,
} = require('../dist/app/module/personal/personal-finance.policy.js');

describe('personal finance policy', () => {
  it('keeps saving independent and subtracts it only from remaining balance', () => {
    assert.deepEqual(
      calculatePersonalSummary({
        INCOME: 45000,
        EXPENSE: 28500,
        SAVING: 10000,
      }),
      {
        income: 45000,
        expense: 28500,
        saving: 10000,
        remainingBalance: 6500,
      },
    );
  });

  it('allows a negative remaining balance without changing saving', () => {
    const summary = calculatePersonalSummary({
      INCOME: 1000,
      EXPENSE: 800,
      SAVING: 500,
    });
    assert.equal(summary.saving, 500);
    assert.equal(summary.remainingBalance, -300);
  });

  it('enforces predefined categories for each transaction type', () => {
    assert.equal(isPersonalCategoryAllowed('INCOME', 'SALARY'), true);
    assert.equal(isPersonalCategoryAllowed('EXPENSE', 'SALARY'), false);
    assert.equal(isPersonalCategoryAllowed('SAVING', 'BANK'), true);
  });

  it('normalizes a requested month to an exclusive UTC range', () => {
    const range = personalMonthRange('2026-08');
    assert.equal(range.start.toISOString(), '2026-08-01T00:00:00.000Z');
    assert.equal(range.end.toISOString(), '2026-09-01T00:00:00.000Z');
  });
});
