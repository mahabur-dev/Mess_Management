const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
  canEditExpense,
  requiresExpenseApproval,
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

  it('auto-approves a member personal expense used only by that member', () => {
    assert.equal(
      requiresExpenseApproval({
        canManage: false,
        paymentType: 'PERSONAL',
        usedBy: 'SELF_ONLY',
      }),
      false,
    );
  });

  it('still requires approval for member-submitted shared or mess-funded expenses', () => {
    assert.equal(
      requiresExpenseApproval({
        canManage: false,
        paymentType: 'PERSONAL',
        usedBy: 'ALL_MEMBERS',
      }),
      true,
    );
    assert.equal(
      requiresExpenseApproval({
        canManage: false,
        paymentType: 'FROM_DEPOSIT',
        usedBy: 'SELF_ONLY',
      }),
      true,
    );
  });

  it('auto-approves manager writes regardless of payment source and usage', () => {
    assert.equal(
      requiresExpenseApproval({
        canManage: true,
        paymentType: 'FROM_DEPOSIT',
        usedBy: 'ALL_MEMBERS',
      }),
      false,
    );
  });

  it('allows members to edit only records they submitted', () => {
    assert.equal(canEditExpense(false, 'member-a', 'member-a'), true);
    assert.equal(canEditExpense(false, 'member-a', 'member-b'), false);
    assert.equal(canEditExpense(true, 'manager', 'member-b'), true);
  });
});
