export type ExpenseApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ExpenseRecordStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

type ExpenseApprovalContext = {
  canManage: boolean;
};

export function requiresExpenseApproval({
  canManage,
}: ExpenseApprovalContext) {
  return !canManage;
}

export function toApprovalStatus(
  status: ExpenseRecordStatus,
): ExpenseApprovalStatus {
  if (status === 'DRAFT') return 'PENDING';
  if (status === 'CANCELLED') return 'REJECTED';
  return 'APPROVED';
}

export function statusForExpenseWrite(
  approved: boolean,
): ExpenseRecordStatus {
  return approved ? 'CONFIRMED' : 'DRAFT';
}

export function canEditExpense(
  canManage: boolean,
  userId: string,
  createdById: string,
) {
  return canManage || userId === createdById;
}
