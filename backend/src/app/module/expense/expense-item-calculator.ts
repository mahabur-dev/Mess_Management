import { ExpenseCalculationError, roundMoney } from './expense-calculator';

export type ExpenseItemAmount = { amount: number };
const MAX_EXPENSE_TOTAL = 9_999_999_999.99;

export function calculateExpenseItemsTotal(items: ExpenseItemAmount[]) {
  if (!items.length) {
    throw new ExpenseCalculationError('At least one expense item is required');
  }

  const total = items.reduce((sum, item, index) => {
    const amount = Number(item.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ExpenseCalculationError(
        `Expense item ${index + 1} amount must be greater than zero`,
      );
    }
    return sum + amount;
  }, 0);

  const roundedTotal = roundMoney(total);
  if (roundedTotal > MAX_EXPENSE_TOTAL) {
    throw new ExpenseCalculationError(
      'Expense total exceeds the supported accounting limit',
    );
  }
  return roundedTotal;
}

export function assertExpenseItemsTotal(
  items: ExpenseItemAmount[],
  expectedTotal: number,
) {
  const itemTotal = calculateExpenseItemsTotal(items);
  if (Math.abs(itemTotal - roundMoney(expectedTotal)) > 0.01) {
    throw new ExpenseCalculationError(
      'Expense amount must match the sum of item amounts',
    );
  }
  return itemTotal;
}
