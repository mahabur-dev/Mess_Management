export type SplitMethod = 'EQUAL' | 'MEAL_COUNT' | 'CUSTOM';

export type SplitMember = {
  id: string;
  name?: string | null;
  mealCount?: number;
};

export type CustomShareInput = {
  memberId: string;
  amount: number;
};

export type CalculatedShare = {
  memberId: string;
  memberName?: string | null;
  mealCount?: number;
  shareAmount: number;
};

export type ExpenseImpact = {
  shares: CalculatedShare[];
  totalSharedCost: number;
  payerCredit: number;
  personalHistoryAmount: number;
};

const MONEY_DECIMALS = 2;

export function roundMoney(value: number) {
  return Number((Math.round((value + Number.EPSILON) * 100) / 100).toFixed(MONEY_DECIMALS));
}

function assertValidAmount(amount: number, label = 'Amount') {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`${label} must be greater than zero`);
  }
}

function withRoundingBalance(
  members: SplitMember[],
  amount: number,
  amountForMember: (member: SplitMember) => number,
) {
  let running = 0;

  return members.map((member, index) => {
    const isLast = index === members.length - 1;
    const shareAmount = isLast
      ? roundMoney(amount - running)
      : roundMoney(amountForMember(member));
    running = roundMoney(running + shareAmount);

    return {
      memberId: member.id,
      memberName: member.name,
      mealCount: member.mealCount,
      shareAmount,
    };
  });
}

export function calculateSplit(params: {
  amount: number;
  paidFrom: string;
  usedBy: string;
  splitMethod: SplitMethod;
  payerMemberId: string;
  members: SplitMember[];
  customShares?: CustomShareInput[];
}): ExpenseImpact {
  const { amount, paidFrom, usedBy, splitMethod, payerMemberId, members } = params;
  assertValidAmount(amount);

  if (!members.length) {
    throw new Error('At least one affected member is required');
  }

  const isPersonalSelfOnly = paidFrom === 'PERSONAL' && usedBy === 'SELF_ONLY';

  if (isPersonalSelfOnly) {
    return {
      shares: members.map((member) => ({
        memberId: member.id,
        memberName: member.name,
        mealCount: member.mealCount,
        shareAmount: 0,
      })),
      totalSharedCost: 0,
      payerCredit: 0,
      personalHistoryAmount: roundMoney(amount),
    };
  }

  let shares: CalculatedShare[];

  if (splitMethod === 'EQUAL') {
    const equalShare = amount / members.length;
    shares = withRoundingBalance(members, amount, () => equalShare);
  } else if (splitMethod === 'MEAL_COUNT') {
    const totalMeals = members.reduce((sum, member) => sum + Number(member.mealCount ?? 0), 0);
    if (totalMeals <= 0) {
      throw new Error('Meal count split requires meal data for the selected members');
    }

    shares = withRoundingBalance(
      members,
      amount,
      (member) => (Number(member.mealCount ?? 0) / totalMeals) * amount,
    );
  } else {
    const customShares = params.customShares ?? [];
    const amountByMember = new Map(customShares.map((share) => [share.memberId, Number(share.amount)]));
    const missingMember = members.find((member) => !amountByMember.has(member.id));
    if (missingMember) {
      throw new Error('Custom split requires an amount for every affected member');
    }

    const total = roundMoney(
      customShares.reduce((sum, share) => sum + Number(share.amount ?? 0), 0),
    );

    if (Math.abs(total - roundMoney(amount)) > 0.01) {
      throw new Error('Custom split total must equal the expense amount');
    }

    shares = members.map((member) => {
      const shareAmount = Number(amountByMember.get(member.id) ?? 0);
      assertValidAmount(shareAmount, 'Custom share');

      return {
        memberId: member.id,
        memberName: member.name,
        mealCount: member.mealCount,
        shareAmount: roundMoney(shareAmount),
      };
    });
  }

  const totalSharedCost = roundMoney(shares.reduce((sum, share) => sum + share.shareAmount, 0));

  return {
    shares,
    totalSharedCost,
    payerCredit: paidFrom === 'PERSONAL' ? roundMoney(amount) : 0,
    personalHistoryAmount: 0,
  };
}
