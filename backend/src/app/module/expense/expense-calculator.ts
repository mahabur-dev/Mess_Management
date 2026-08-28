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
};

const MONEY_DECIMALS = 2;

export class ExpenseCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExpenseCalculationError';
  }
}

export function roundMoney(value: number) {
  return Number(
    (Math.round((value + Number.EPSILON) * 100) / 100).toFixed(MONEY_DECIMALS),
  );
}

function assertValidAmount(amount: number, label = 'Amount') {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ExpenseCalculationError(`${label} must be greater than zero`);
  }
}

function assertUniqueMemberIds(members: SplitMember[]) {
  const memberIds = members.map((member) => member.id);
  if (memberIds.some((memberId) => !memberId)) {
    throw new ExpenseCalculationError('Every affected member must have an id');
  }
  if (new Set(memberIds).size !== memberIds.length) {
    throw new ExpenseCalculationError('Affected members must be unique');
  }
}

function assertSplitTotal(shares: CalculatedShare[], amount: number) {
  const total = roundMoney(
    shares.reduce((sum, share) => sum + Number(share.shareAmount ?? 0), 0),
  );
  if (Math.abs(total - roundMoney(amount)) > 0.01) {
    throw new ExpenseCalculationError(
      'Calculated shares must equal the expense amount',
    );
  }
  return total;
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
  members: SplitMember[];
  customShares?: CustomShareInput[];
}): ExpenseImpact {
  const { amount, paidFrom, usedBy, splitMethod, members } = params;
  assertValidAmount(amount);

  if (usedBy === 'SELF_ONLY') {
    throw new ExpenseCalculationError(
      'Self-only expenses are no longer supported; use Personal Finance instead',
    );
  }

  if (!members.length) {
    throw new ExpenseCalculationError(
      'At least one affected member is required',
    );
  }
  assertUniqueMemberIds(members);

  let shares: CalculatedShare[];

  if (splitMethod === 'EQUAL') {
    const equalShare = amount / members.length;
    shares = withRoundingBalance(members, amount, () => equalShare);
  } else if (splitMethod === 'MEAL_COUNT') {
    const totalMeals = members.reduce(
      (sum, member) => sum + Number(member.mealCount ?? 0),
      0,
    );
    if (totalMeals <= 0) {
      throw new ExpenseCalculationError(
        'Meal count split requires meal data for the selected members',
      );
    }

    shares = withRoundingBalance(
      members,
      amount,
      (member) => (Number(member.mealCount ?? 0) / totalMeals) * amount,
    );
  } else {
    const customShares = params.customShares ?? [];
    const affectedMemberIds = new Set(members.map((member) => member.id));
    const customMemberIds = customShares.map((share) => share.memberId);

    if (new Set(customMemberIds).size !== customMemberIds.length) {
      throw new ExpenseCalculationError(
        'Custom split cannot contain duplicate members',
      );
    }

    const unexpectedMember = customMemberIds.find(
      (memberId) => !affectedMemberIds.has(memberId),
    );
    if (unexpectedMember) {
      throw new ExpenseCalculationError(
        'Custom split can include only affected members',
      );
    }

    const amountByMember = new Map(
      customShares.map((share) => [share.memberId, Number(share.amount)]),
    );
    const missingMember = members.find(
      (member) => !amountByMember.has(member.id),
    );
    if (missingMember) {
      throw new ExpenseCalculationError(
        'Custom split requires an amount for every affected member',
      );
    }

    const total = roundMoney(
      members.reduce(
        (sum, member) => sum + Number(amountByMember.get(member.id) ?? 0),
        0,
      ),
    );

    if (Math.abs(total - roundMoney(amount)) > 0.01) {
      throw new ExpenseCalculationError(
        'Custom split total must equal the expense amount',
      );
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

  const totalSharedCost = assertSplitTotal(shares, amount);

  return {
    shares,
    totalSharedCost,
    payerCredit: paidFrom === 'PERSONAL' ? roundMoney(amount) : 0,
  };
}
