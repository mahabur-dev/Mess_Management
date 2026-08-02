const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
  canEditExpense,
  statusForExpenseWrite,
  toApprovalStatus,
} = require('../dist/app/module/expense/expense-approval.policy.js');

describe('expense approval policy', () => {
  it('auto-approves manager writes and queues member writes', () => {
    assert.equal(statusForExpenseWrite(true), 'CONFIRMED');
    assert.equal(statusForExpenseWrite(false), 'DRAFT');
  });

  it('maps internal lifecycle states to API approval states', () => {
    assert.equal(toApprovalStatus('DRAFT'), 'PENDING');
    assert.equal(toApprovalStatus('CONFIRMED'), 'APPROVED');
    assert.equal(toApprovalStatus('CANCELLED'), 'REJECTED');
  });

  it('allows members to edit only records they submitted', () => {
    assert.equal(canEditExpense(false, 'member-a', 'member-a'), true);
    assert.equal(canEditExpense(false, 'member-a', 'member-b'), false);
    assert.equal(canEditExpense(true, 'manager', 'member-b'), true);
  });
});
