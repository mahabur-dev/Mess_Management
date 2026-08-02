export type PaymentApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export function statusForPaymentWrite(
  canManage: boolean,
): PaymentApprovalStatus {
  return canManage ? 'APPROVED' : 'PENDING';
}

export function canEditPayment(
  canManage: boolean,
  userId: string,
  createdById: string,
) {
  return canManage || userId === createdById;
}
