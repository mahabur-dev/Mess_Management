const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
  canEditPayment,
  statusForPaymentWrite,
} = require('../dist/app/module/payment/payment-approval.policy.js');

describe('payment approval policy', () => {
  it('auto-approves manager deposits and queues member deposits', () => {
    assert.equal(statusForPaymentWrite(true), 'APPROVED');
    assert.equal(statusForPaymentWrite(false), 'PENDING');
  });

  it('allows members to edit only deposits they submitted', () => {
    assert.equal(canEditPayment(false, 'member-a', 'member-a'), true);
    assert.equal(canEditPayment(false, 'member-a', 'member-b'), false);
    assert.equal(canEditPayment(true, 'manager', 'member-b'), true);
  });
});
