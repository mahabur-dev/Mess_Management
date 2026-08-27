import { PersonalTransactionType } from '@prisma/client';

export const PERSONAL_CATEGORIES = {
  [PersonalTransactionType.INCOME]: [
    'SALARY',
    'BUSINESS',
    'FREELANCE',
    'GIFT',
    'OTHER',
  ],
  [PersonalTransactionType.EXPENSE]: [
    'FOOD',
    'GROCERY',
    'TRANSPORT',
    'RENT',
    'EDUCATION',
    'MEDICAL',
    'SHOPPING',
    'BILLS',
    'ENTERTAINMENT',
    'OTHER',
  ],
  [PersonalTransactionType.SAVING]: ['BANK', 'CASH', 'INVESTMENT', 'OTHER'],
} as const;

export type PersonalSummary = {
  income: number;
  expense: number;
  saving: number;
  remainingBalance: number;
};

export function isPersonalCategoryAllowed(
  type: PersonalTransactionType,
  category: string,
) {
  return (PERSONAL_CATEGORIES[type] as readonly string[]).includes(
    category.toUpperCase(),
  );
}

export function calculatePersonalSummary(
  amounts: Partial<Record<PersonalTransactionType, number>>,
): PersonalSummary {
  const income = Number(amounts.INCOME ?? 0);
  const expense = Number(amounts.EXPENSE ?? 0);
  const saving = Number(amounts.SAVING ?? 0);

  return {
    income: Number(income.toFixed(2)),
    expense: Number(expense.toFixed(2)),
    saving: Number(saving.toFixed(2)),
    remainingBalance: Number((income - expense - saving).toFixed(2)),
  };
}

export function personalMonthRange(value?: string, now = new Date()) {
  const match = value ? /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(value) : null;
  const year = match ? Number(match[1]) : now.getUTCFullYear();
  const monthIndex = match ? Number(match[2]) - 1 : now.getUTCMonth();

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(monthIndex) ||
    monthIndex < 0 ||
    monthIndex > 11
  ) {
    throw new TypeError('Invalid month');
  }

  return {
    start: new Date(Date.UTC(year, monthIndex, 1)),
    end: new Date(Date.UTC(year, monthIndex + 1, 1)),
  };
}
