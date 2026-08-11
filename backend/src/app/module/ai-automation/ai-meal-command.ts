import type { MealName, MealStatus } from './ai-command.types';

const DAY_MS = 86_400_000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 366;

function parseDateKey(value: string): Date {
  if (!DATE_PATTERN.test(value)) throw new Error('Meal date must use YYYY-MM-DD');
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error('Meal date is invalid');
  }
  return date;
}

export function calculateBillableMealCount(
  mealName: Exclude<MealName, 'OTHER'>,
  servings: number | null | undefined,
  status: MealStatus = 'ON',
): number {
  if (status === 'OFF') return 0;

  const quantity = servings ?? 1;
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('Meal quantity must be greater than zero');
  }

  const baseValue = mealName === 'BREAKFAST' ? 0.5 : 1;
  return Number((quantity * baseValue).toFixed(2));
}

export function expandMealDateRange(startDate: string, endDate?: string | null): string[] {
  const start = parseDateKey(startDate);
  const end = endDate ? parseDateKey(endDate) : start;
  if (end.getTime() < start.getTime()) {
    throw new Error('Meal end date cannot be before the start date');
  }

  const totalDays = Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1;
  if (totalDays > MAX_RANGE_DAYS) {
    throw new Error(`A meal date range cannot exceed ${MAX_RANGE_DAYS} days`);
  }

  return Array.from({ length: totalDays }, (_, index) =>
    new Date(start.getTime() + index * DAY_MS).toISOString().slice(0, 10),
  );
}
