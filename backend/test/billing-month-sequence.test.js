const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
  buildBillingMonthSequence,
} = require('../dist/app/module/monthly-bill/billing-month-sequence.js');

describe('buildBillingMonthSequence', () => {
  it('normalizes, deduplicates, and orders affected months', () => {
    const result = buildBillingMonthSequence([
      new Date('2026-08-19T12:00:00Z'),
      new Date('2026-07-31T23:00:00Z'),
      new Date('2026-08-01T00:00:00Z'),
    ]);

    assert.deepEqual(
      result.map((month) => month.toISOString().slice(0, 10)),
      ['2026-07-01', '2026-08-01'],
    );
  });

  it('adds later existing bill months so carried balances are refreshed', () => {
    const result = buildBillingMonthSequence(
      [new Date('2026-05-15T00:00:00Z')],
      [
        new Date('2026-04-01T00:00:00Z'),
        new Date('2026-05-01T00:00:00Z'),
        new Date('2026-06-01T00:00:00Z'),
        new Date('2026-08-01T00:00:00Z'),
      ],
    );

    assert.deepEqual(
      result.map((month) => month.toISOString().slice(0, 10)),
      ['2026-05-01', '2026-06-01', '2026-08-01'],
    );
  });

  it('returns no work when no valid affected date is supplied', () => {
    assert.deepEqual(buildBillingMonthSequence([]), []);
    assert.deepEqual(
      buildBillingMonthSequence([new Date('invalid')]),
      [],
    );
  });
});
