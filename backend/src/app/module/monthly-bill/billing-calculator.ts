import { BillStatus } from '@prisma/client';

export function roundBillingAmount(value: number): number {
  if (!Number.isFinite(value)) {
    throw new TypeError('Billing amounts must be finite numbers');
  }
  return Number((Math.round((value + Number.EPSILON) * 100) / 100).toFixed(2));
}

export function calculateMemberBalance(input: {
  currentCost: number;
  deposits: number;
  payments: number;
  previousBalance: number;
}) {
  const currentCost = roundBillingAmount(input.currentCost);
  const deposits = roundBillingAmount(input.deposits);
  const payments = roundBillingAmount(input.payments);
  const previousBalance = roundBillingAmount(input.previousBalance);
  const totalPaid = roundBillingAmount(deposits + payments);
  const balance = roundBillingAmount(currentCost - totalPaid + previousBalance);
  const finalDue = roundBillingAmount(Math.max(balance, 0));
  const creditBalance = roundBillingAmount(Math.max(-balance, 0));
  const status =
    finalDue <= 0
      ? BillStatus.PAID
      : totalPaid > 0
        ? BillStatus.PARTIAL
        : BillStatus.PENDING;

  return { totalPaid, balance, finalDue, creditBalance, status };
}

export function summarizeMemberBalances(
  balances: Array<number | null | undefined>,
) {
  return balances.reduce(
    (summary, value) => {
      const balance = roundBillingAmount(Number(value ?? 0));
      summary.totalDue = roundBillingAmount(
        summary.totalDue + Math.max(balance, 0),
      );
      summary.totalCredit = roundBillingAmount(
        summary.totalCredit + Math.max(-balance, 0),
      );
      summary.netBalance = roundBillingAmount(summary.netBalance + balance);
      return summary;
    },
    { totalDue: 0, totalCredit: 0, netBalance: 0 },
  );
}

export function allocateAmountByWeight(
  amount: number,
  members: Array<{ memberId: string; weight: number }>,
) {
  const validMembers = members.filter((member) => member.weight > 0);
  const totalWeight = validMembers.reduce(
    (sum, member) => sum + member.weight,
    0,
  );
  if (!validMembers.length || totalWeight <= 0)
    return new Map<string, number>();

  let allocated = 0;
  const result = new Map<string, number>();
  validMembers.forEach((member, index) => {
    const share =
      index === validMembers.length - 1
        ? roundBillingAmount(amount - allocated)
        : roundBillingAmount((amount * member.weight) / totalWeight);
    allocated = roundBillingAmount(allocated + share);
    result.set(member.memberId, share);
  });
  return result;
}
