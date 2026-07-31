const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
  calculateFundBalances,
} = require('../dist/app/module/fund-ledger/fund-balance-calculator.js');

describe('calculateFundBalances', () => {
  it('keeps mess-deposit and collected-fund accounts independent', () => {
    const result = calculateFundBalances({
      approvedPayments: 2_500,
      directDeposits: 500,
      messExpenseDebits: 1_250,
      collectedFundCredits: 800,
      collectedFundDebits: 275,
    });

    assert.deepEqual(result, {
      messDepositBalance: 1_750,
      collectedFundBalance: 525,
    });
  });

  it('exposes negative balances so invariant checks can reject overspending', () => {
    const result = calculateFundBalances({
      approvedPayments: 100,
      directDeposits: 0,
      messExpenseDebits: 150,
      collectedFundCredits: 0,
      collectedFundDebits: 25,
    });

    assert.equal(result.messDepositBalance, -50);
    assert.equal(result.collectedFundBalance, -25);
  });

  it('rejects non-finite financial inputs', () => {
    assert.throws(
      () =>
        calculateFundBalances({
          approvedPayments: Number.NaN,
          directDeposits: 0,
          messExpenseDebits: 0,
          collectedFundCredits: 0,
          collectedFundDebits: 0,
        }),
      /finite numbers/,
    );
  });
});
