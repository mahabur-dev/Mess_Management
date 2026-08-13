const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
  buildDeterministicOrder,
} = require('../dist/app/helpers/deterministic-order.js');

const base = {
  aliases: { date: 'expense_date' },
  allowedFields: ['expense_date', 'created_at', 'amount'],
  businessDateField: 'expense_date',
};

describe('deterministic list ordering', () => {
  it('defaults to newest business date with stable creation and id tie-breakers', () => {
    assert.deepEqual(buildDeterministicOrder(base), [
      { expense_date: 'desc' },
      { created_at: 'desc' },
      { id: 'desc' },
    ]);
  });

  it('normalizes aliases and keeps pagination deterministic', () => {
    assert.deepEqual(
      buildDeterministicOrder({
        ...base,
        requestedField: 'date',
        requestedDirection: 'desc',
      }),
      [
        { expense_date: 'desc' },
        { created_at: 'desc' },
        { id: 'desc' },
      ],
    );
  });

  it('uses newest records as tie-breakers for a supported custom sort', () => {
    assert.deepEqual(
      buildDeterministicOrder({
        ...base,
        requestedField: 'amount',
        requestedDirection: 'asc',
      }),
      [
        { amount: 'asc' },
        { expense_date: 'desc' },
        { created_at: 'desc' },
        { id: 'desc' },
      ],
    );
  });

  it('falls back safely when a requested field is not allowed', () => {
    assert.deepEqual(
      buildDeterministicOrder({ ...base, requestedField: 'unsafe_column' }),
      [
        { expense_date: 'desc' },
        { created_at: 'desc' },
        { id: 'desc' },
      ],
    );
  });
});
