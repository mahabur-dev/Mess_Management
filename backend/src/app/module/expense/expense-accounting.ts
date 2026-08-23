import {
  ExpenseCategory,
  ExpenseSplitMethod,
  ExpenseUsedBy,
  Prisma,
} from '@prisma/client';

const COMMUNAL_FOOD_CATEGORIES = [
  ExpenseCategory.FOOD,
  ExpenseCategory.GROCERY,
] as const;

export const communalMealExpenseWhere = {
  category: { in: [...COMMUNAL_FOOD_CATEGORIES] },
  used_by: ExpenseUsedBy.ALL_MEMBERS,
  split_method: ExpenseSplitMethod.MEAL_COUNT,
} satisfies Prisma.ExpenseWhereInput;

export function isFoodExpense(category: ExpenseCategory) {
  return COMMUNAL_FOOD_CATEGORIES.includes(
    category as (typeof COMMUNAL_FOOD_CATEGORIES)[number],
  );
}

export function isCommunalMealExpense(expense: {
  category: ExpenseCategory;
  used_by: ExpenseUsedBy;
  split_method: ExpenseSplitMethod;
}) {
  return (
    isFoodExpense(expense.category) &&
    expense.used_by === ExpenseUsedBy.ALL_MEMBERS &&
    expense.split_method === ExpenseSplitMethod.MEAL_COUNT
  );
}

export function isUtilitySplitAllowed(
  usedBy: ExpenseUsedBy,
  splitMethod: ExpenseSplitMethod,
) {
  return (
    usedBy !== ExpenseUsedBy.MEAL_ON_MEMBERS &&
    splitMethod !== ExpenseSplitMethod.MEAL_COUNT
  );
}

function roundCurrency(value: number) {
  return Number((Math.round((value + Number.EPSILON) * 100) / 100).toFixed(2));
}

export function calculateAdditionalFoodExpenseTotal(
  allEligibleFoodExpenses: number,
  communalMealExpenses: number,
) {
  if (
    !Number.isFinite(allEligibleFoodExpenses) ||
    !Number.isFinite(communalMealExpenses)
  ) {
    throw new TypeError('Food expense totals must be finite numbers');
  }

  return roundCurrency(
    Math.max(allEligibleFoodExpenses - communalMealExpenses, 0),
  );
}

export function calculateMemberFoodBill(params: {
  memberMeals: number;
  communalMealRate: number;
  assignedFoodExpense: number;
}) {
  const regularMealCharge = roundCurrency(
    params.memberMeals * params.communalMealRate,
  );
  const assignedFoodExpense = roundCurrency(params.assignedFoodExpense);

  return {
    regularMealCharge,
    assignedFoodExpense,
    totalFoodBill: roundCurrency(regularMealCharge + assignedFoodExpense),
  };
}
