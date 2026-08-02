const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
  allocateAmountByWeight,
  calculateMemberBalance,
  summarizeMemberBalances,
} = require('../dist/app/module/monthly-bill/billing-calculator.js');

describe('monthly billing calculator', () => {
  it('calculates a positive member due after deposits and payments', () => {
    assert.deepEqual(
      calculateMemberBalance({
        currentCost: 1500,
        deposits: 300,
        payments: 200,
        previousBalance: 100,
      }),
      {
        totalPaid: 500,
        balance: 1100,
        finalDue: 1100,
        creditBalance: 0,
        status: 'PARTIAL',
      },
    );
  });

  it('keeps overpayment as credit instead of subtracting due twice', () => {
    assert.deepEqual(
      calculateMemberBalance({
        currentCost: 1000,
        deposits: 1200,
        payments: 0,
        previousBalance: 0,
      }),
      {
        totalPaid: 1200,
        balance: -200,
        finalDue: 0,
        creditBalance: 200,
        status: 'PAID',
      },
    );
  });

  it('lets a payment cover both current cost and previous due', () => {
    const result = calculateMemberBalance({
      currentCost: 1000,
      deposits: 1300,
      payments: 0,
      previousBalance: 200,
    });
    assert.equal(result.finalDue, 0);
    assert.equal(result.creditBalance, 100);
  });

  it('does not cancel one member due against another member credit', () => {
    assert.deepEqual(summarizeMemberBalances([700, -200, 0]), {
      totalDue: 700,
      totalCredit: 200,
      netBalance: 500,
    });
  });

  it('allocates weighted expenses exactly after rounding', () => {
    const shares = allocateAmountByWeight(100, [
      { memberId: 'a', weight: 1 },
      { memberId: 'b', weight: 1 },
      { memberId: 'c', weight: 1 },
    ]);
    assert.deepEqual(
      [...shares.entries()],
      [
        ['a', 33.33],
        ['b', 33.33],
        ['c', 33.34],
      ],
    );
  });
});
