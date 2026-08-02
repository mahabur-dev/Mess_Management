const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
  ExpenseCalculationError,
  calculateSplit,
} = require('../dist/app/module/expense/expense-calculator.js');

const baseInput = {
  amount: 100,
  paidFrom: 'FROM_DEPOSIT',
  usedBy: 'ALL_MEMBERS',
  splitMethod: 'EQUAL',
  members: [
    { id: 'member-a', name: 'Member A' },
    { id: 'member-b', name: 'Member B' },
    { id: 'member-c', name: 'Member C' },
  ],
};

describe('calculateSplit', () => {
  it('balances equal-split rounding to the exact expense amount', () => {
    const result = calculateSplit(baseInput);

    assert.deepEqual(
      result.shares.map((share) => share.shareAmount),
      [33.33, 33.33, 33.34],
    );
    assert.equal(result.totalSharedCost, 100);
    assert.equal(result.payerCredit, 0);
  });

  it('calculates meal-count shares and preserves the exact total', () => {
    const result = calculateSplit({
      ...baseInput,
      amount: 175,
      splitMethod: 'MEAL_COUNT',
      members: [
        { id: 'member-a', mealCount: 1 },
        { id: 'member-b', mealCount: 2.5 },
      ],
    });

    assert.deepEqual(
      result.shares.map((share) => share.shareAmount),
      [50, 125],
    );
    assert.equal(result.totalSharedCost, 175);
  });

  it('keeps a personal self-only expense out of shared billing', () => {
    const result = calculateSplit({
      ...baseInput,
      amount: 250,
      paidFrom: 'PERSONAL',
      usedBy: 'SELF_ONLY',
      members: [{ id: 'member-a' }],
    });

    assert.equal(result.totalSharedCost, 0);
    assert.equal(result.payerCredit, 0);
    assert.equal(result.personalHistoryAmount, 250);
    assert.equal(result.shares[0].shareAmount, 0);
  });

  it('rejects duplicate custom-share members', () => {
    assert.throws(
      () =>
        calculateSplit({
          ...baseInput,
          splitMethod: 'CUSTOM',
          members: [{ id: 'member-a' }, { id: 'member-b' }],
          customShares: [
            { memberId: 'member-a', amount: 30 },
            { memberId: 'member-a', amount: 20 },
            { memberId: 'member-b', amount: 50 },
          ],
        }),
      (error) =>
        error instanceof ExpenseCalculationError &&
        error.message === 'Custom split cannot contain duplicate members',
    );
  });

  it('rejects custom shares for members outside the affected set', () => {
    assert.throws(
      () =>
        calculateSplit({
          ...baseInput,
          splitMethod: 'CUSTOM',
          members: [{ id: 'member-a' }, { id: 'member-b' }],
          customShares: [
            { memberId: 'member-a', amount: 40 },
            { memberId: 'member-b', amount: 40 },
            { memberId: 'member-c', amount: 20 },
          ],
        }),
      (error) =>
        error instanceof ExpenseCalculationError &&
        error.message === 'Custom split can include only affected members',
    );
  });

  it('rejects incomplete and unbalanced custom splits', () => {
    assert.throws(
      () =>
        calculateSplit({
          ...baseInput,
          splitMethod: 'CUSTOM',
          members: [{ id: 'member-a' }, { id: 'member-b' }],
          customShares: [{ memberId: 'member-a', amount: 100 }],
        }),
      /amount for every affected member/,
    );

    assert.throws(
      () =>
        calculateSplit({
          ...baseInput,
          splitMethod: 'CUSTOM',
          members: [{ id: 'member-a' }, { id: 'member-b' }],
          customShares: [
            { memberId: 'member-a', amount: 40 },
            { memberId: 'member-b', amount: 40 },
          ],
        }),
      /total must equal the expense amount/,
    );
  });
});
