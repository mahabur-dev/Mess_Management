export type PersonalLocale = "en" | "bn";
export type PersonalTransactionType = "INCOME" | "EXPENSE" | "SAVING";

export type FamilyMember = {
  id: string;
  name: string;
  relation: string;
  monthlyExpense?: number;
  categoryBreakdown?: Record<string, number>;
  created_at?: string;
  updated_at?: string;
};

export type PersonalTransaction = {
  id: string;
  type: PersonalTransactionType;
  category: string;
  amount: string | number;
  date: string;
  description?: string | null;
  family_member_id?: string | null;
  family_member?: Pick<FamilyMember, "id" | "name" | "relation"> | null;
  created_at?: string;
  updated_at?: string;
};

export type PersonalTransactionInput = {
  type: PersonalTransactionType;
  category: string;
  amount: number;
  date: string;
  description?: string;
  familyMemberId?: string | null;
};

export type PersonalSummary = {
  month: string;
  income: number;
  expense: number;
  saving: number;
  remainingBalance: number;
  recentTransactions: PersonalTransaction[];
};

export type PersonalBudget = {
  id: string;
  month: string;
  category: string;
  limit_amount: string | number;
  spentAmount: number;
  remainingAmount: number;
  progressPercent: number;
  isExceeded: boolean;
};

export type PersonalReport = PersonalSummary & {
  expenseCategoryBreakdown: Array<{ category: string; amount: number }>;
};

export type PersonalTransactionFilters = {
  month?: string;
  type?: PersonalTransactionType;
  category?: string;
  familyMemberId?: string;
  search?: string;
  page?: number;
  limit?: number;
};
