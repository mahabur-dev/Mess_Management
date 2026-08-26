import { api } from "@/lib/api";
import type {
  PersonalTransactionFilters,
  PersonalTransactionInput,
} from "../types";

export const personalApi = {
  summary: (month: string) => api.getPersonalSummary(month),
  reports: (month: string) => api.getPersonalReports(month),
  transactions: (filters: PersonalTransactionFilters) =>
    api.getPersonalTransactions(filters),
  createTransaction: (data: PersonalTransactionInput) =>
    api.createPersonalTransaction(data),
  updateTransaction: (id: string, data: Partial<PersonalTransactionInput>) =>
    api.updatePersonalTransaction(id, data),
  deleteTransaction: (id: string) => api.deletePersonalTransaction(id),
  familyMembers: (month: string) => api.getPersonalFamilyMembers(month),
  createFamilyMember: (data: { name: string; relation: string }) =>
    api.createPersonalFamilyMember(data),
  updateFamilyMember: (
    id: string,
    data: { name?: string; relation?: string },
  ) => api.updatePersonalFamilyMember(id, data),
  deleteFamilyMember: (id: string) => api.deletePersonalFamilyMember(id),
  budgets: (month: string) => api.getPersonalBudgets(month),
  createBudget: (data: {
    month: string;
    category: string;
    limitAmount: number;
  }) => api.createPersonalBudget(data),
  updateBudget: (id: string, limitAmount: number) =>
    api.updatePersonalBudget(id, { limitAmount }),
  deleteBudget: (id: string) => api.deletePersonalBudget(id),
};
