const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
  assertExpenseItemsTotal,
  calculateExpenseItemsTotal,
} = require('../dist/app/module/expense/expense-item-calculator.js');

describe('expense item totals', () => {
  it('calculates one accounting total from multiple purchased items', () => {
    assert.equal(
      calculateExpenseItemsTotal([
        { amount: 350 },
        { amount: 420 },
        { amount: 10.125 },
      ]),
      780.13,
    );
  });

  it('rejects empty, zero, negative, and invalid line amounts', () => {
    assert.throws(() => calculateExpenseItemsTotal([]), /at least one/i);
    assert.throws(() => calculateExpenseItemsTotal([{ amount: 0 }]), /greater than zero/i);
    assert.throws(() => calculateExpenseItemsTotal([{ amount: -1 }]), /greater than zero/i);
    assert.throws(() => calculateExpenseItemsTotal([{ amount: Number.NaN }]), /greater than zero/i);
    assert.throws(
      () => calculateExpenseItemsTotal([{ amount: 9_999_999_999 }, { amount: 1 }]),
      /accounting limit/i,
    );
  });

  it('detects a client total that does not match its items', () => {
    assert.equal(assertExpenseItemsTotal([{ amount: 10 }, { amount: 20 }], 30), 30);
    assert.throws(
      () => assertExpenseItemsTotal([{ amount: 10 }, { amount: 20 }], 29),
      /must match the sum/i,
    );
  });
});
