export type ExpenseApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ExpenseRecordStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

type ExpenseApprovalContext = {
  canManage: boolean;
  paymentType: string;
  usedBy: string;
};

export function requiresExpenseApproval({
  canManage,
  paymentType,
  usedBy,
}: ExpenseApprovalContext) {
  if (canManage) return false;
  return !(paymentType === 'PERSONAL' && usedBy === 'SELF_ONLY');
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
