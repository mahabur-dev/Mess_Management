const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
  billingMonthStart,
  billingMonthRange,
  currentDhakaDate,
  currentDhakaMonth,
} = require('../dist/app/module/monthly-bill/billing-period.js');

describe('billing period', () => {
  it('parses an explicit billing month without timezone drift', () => {
    const range = billingMonthRange('2026-08-31');
    assert.equal(range.start.toISOString(), '2026-08-01T00:00:00.000Z');
    assert.equal(range.end.toISOString(), '2026-09-01T00:00:00.000Z');
  });

  it('uses Dhaka date at the UTC month boundary', () => {
    const now = new Date('2026-07-31T19:30:00.000Z');
    assert.equal(
      billingMonthStart(now).toISOString(),
      '2026-08-01T00:00:00.000Z',
    );
    assert.equal(
      currentDhakaDate(now).toISOString(),
      '2026-08-01T00:00:00.000Z',
    );
    assert.equal(
      currentDhakaMonth(now).toISOString(),
      '2026-08-01T00:00:00.000Z',
    );
  });
});
