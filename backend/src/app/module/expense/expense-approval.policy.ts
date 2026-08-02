export type ExpenseApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ExpenseRecordStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export function toApprovalStatus(
  status: ExpenseRecordStatus,
): ExpenseApprovalStatus {
  if (status === 'DRAFT') return 'PENDING';
  if (status === 'CANCELLED') return 'REJECTED';
  return 'APPROVED';
}

export function statusForExpenseWrite(
  canManage: boolean,
): ExpenseRecordStatus {
  return canManage ? 'CONFIRMED' : 'DRAFT';
}

export function canEditExpense(
  canManage: boolean,
  userId: string,
  createdById: string,
) {
  return canManage || userId === createdById;
}
