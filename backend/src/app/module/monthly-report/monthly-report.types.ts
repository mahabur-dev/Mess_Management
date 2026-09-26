export type MonthlyReportMemberSnapshot = {
  memberId: string;
  name: string;
  email: string;
  totalMeals: number;
  mealCost: number;
  otherCost: number;
  rentCost: number;
  utilityCost: number;
  totalAmount: number;
  deposit: number;
  paidAmount: number;
  previousBalance: number;
  balance: number;
  due: number;
  credit: number;
  status: string;
  role?: string;
};

export type MonthlyReportExpenseEntry = {
  id: string;
  date: string;
  purchasedBy: string;
  category: string;
  description?: string;
  amount: number;
};

export type MonthlyReportDepositEntry = {
  id: string;
  date: string;
  member: string;
  method: string;
  amount: number;
};

export type MonthlyReportSnapshot = {
  schemaVersion: 1;
  mess: {
    id: string;
    name: string;
    currency: string;
  };
  month: string;
  summary: {
    totalMembers: number;
    totalMeals: number;
    totalExpense: number;
    totalDeposit: number;
    mealRate: number;
    totalMessCost: number;
    totalDue: number;
    totalCredit: number;
  };
  expenseSummary: {
    foodBazar: number;
    utility: number;
    rentHouse: number;
    otherExpenses: number;
    totalExpense: number;
    totalMessCost: number;
  };
  members: MonthlyReportMemberSnapshot[];
  expenseRegister?: MonthlyReportExpenseEntry[];
  depositRegister?: MonthlyReportDepositEntry[];
};

export function isMonthlyReportSnapshot(value: unknown): value is MonthlyReportSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const input = value as Partial<MonthlyReportSnapshot>;
  return (
    input.schemaVersion === 1 &&
    Boolean(input.mess?.id) &&
    typeof input.month === 'string' &&
    Boolean(input.summary) &&
    Boolean(input.expenseSummary) &&
    Array.isArray(input.members)
  );
}
