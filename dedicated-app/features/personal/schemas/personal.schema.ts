import { PERSONAL_CATEGORIES } from "../constants";
import type { PersonalTransactionInput } from "../types";

export function validatePersonalTransaction(input: PersonalTransactionInput) {
  if (
    !input.date ||
    !input.category ||
    !PERSONAL_CATEGORIES[input.type].includes(input.category)
  )
    return "required";
  if (!Number.isFinite(input.amount) || input.amount <= 0) return "amount";
  return null;
}

export function validateFamilyMember(name: string, relation: string) {
  return Boolean(name.trim() && relation.trim());
}

export function validatePersonalBudget(category: string, amount: number) {
  return Boolean(
    PERSONAL_CATEGORIES.EXPENSE.includes(category) &&
    Number.isFinite(amount) &&
    amount > 0,
  );
}
