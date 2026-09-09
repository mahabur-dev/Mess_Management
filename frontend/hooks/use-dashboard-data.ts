import useSWR from 'swr'
import { swrFetcher } from '@/lib/swr-fetcher'
import { apiClient } from '@/lib/api-client'
import type { BazarSchedule, Notice, Payment } from '@/lib/api-client'

export type RecentExpense = {
  id: string
  item_name?: string | null
  category?: string | null
  amount: string | number
  expense_date: string
  approvalStatus?: string | null
  creator?: { name?: string | null } | null
}

export type DashboardActivity = {
  expenses: RecentExpense[]
  payments: Payment[]
  notices: Notice[]
  schedule: BazarSchedule | null
}

// ─── SWR Configs ──────────────────────────────────────────────
// Static data: rarely changes (mess list, subscription, admin dashboard)
const STATIC_SWR = {
  revalidateOnFocus: true,
  dedupingInterval: 15_000,
  refreshInterval: 30_000,
}

// Dynamic data: changes frequently (dashboard stats, charts, meals)
const DYNAMIC_SWR = {
  revalidateOnFocus: true,
  dedupingInterval: 5_000,
  refreshInterval: 10_000,
}

// ─── Mess List (static) ───────────────────────────────────────
export function useMesses(userId: string | undefined, enabled = true) {
  return useSWR(
    enabled && userId ? ['messes', userId] : null,
    () => swrFetcher(() => apiClient.getMesses()),
    STATIC_SWR,
  )
}

export function useMyMemberJoinRequests(userId: string | undefined, enabled = true) {
  return useSWR(
    enabled && userId ? ['my-member-join-requests', userId] : null,
    () => swrFetcher(() => apiClient.getMyMemberJoinRequests()),
    STATIC_SWR,
  )
}

// ─── Mess Dashboard (dynamic) ─────────────────────────────────
// month format: "YYYY-MM", but backend expects "YYYY-MM-01"
export function useMessDashboard(messId: string | undefined, month: string) {
  return useSWR(
    messId ? ['mess-dashboard', messId, month] : null,
    ([, id, m]) => swrFetcher(() => apiClient.getMessDashboard(id, `${m}-01`)),
    DYNAMIC_SWR,
  )
}

// ─── Mess Subscription (static) ───────────────────────────────
export function useMessSubscription(messId: string | undefined) {
  return useSWR(
    messId ? ['mess-subscription', messId] : null,
    ([, id]) => swrFetcher(() => apiClient.getMessSubscription(id)),
    STATIC_SWR,
  )
}

// ─── Admin Dashboard (static) ─────────────────────────────────
export function useAdminDashboard(enabled = true) {
  return useSWR(
    enabled ? 'admin-dashboard' : null,
    () => swrFetcher(() => apiClient.getAdminDashboard()),
    STATIC_SWR,
  )
}

export function useRunningMesses(enabled = true, page = 1, limit = 25) {
  return useSWR(
    enabled ? ['running-messes', page, limit] : null,
    () => swrFetcher(() => apiClient.getRunningMesses({ page, limit })),
    STATIC_SWR,
  )
}

// ─── Monthly Overview Chart (dynamic) ─────────────────────────
export function useMonthlyOverview(messId: string | undefined, month: string) {
  return useSWR(
    messId ? ['monthly-overview', messId, month] : null,
    ([, id, m]) => swrFetcher(() => apiClient.getMonthlyOverview(id, `${m}-01`)),
    DYNAMIC_SWR,
  )
}

// ─── Expense Breakdown Chart (dynamic) ────────────────────────
export function useExpenseBreakdown(messId: string | undefined, month: string) {
  return useSWR(
    messId ? ['expense-breakdown', messId, month] : null,
    ([, id, m]) => swrFetcher(() => apiClient.getExpenseBreakdown(id, `${m}-01`)),
    DYNAMIC_SWR,
  )
}

// ─── Weekly Meal Count Chart (dynamic) ────────────────────────
export function useWeeklyMealCount(messId: string | undefined) {
  return useSWR(
    messId ? ['weekly-meals', messId] : null,
    ([, id]) => swrFetcher(() => apiClient.getWeeklyMealCount(id)),
    DYNAMIC_SWR,
  )
}

export function useDashboardActivity(
  messId: string | undefined,
  year: number,
  month: number,
  canManagePayments: boolean,
) {
  return useSWR<DashboardActivity>(
    messId ? ['dashboard-activity', messId, year, month, canManagePayments] : null,
    async () => {
      const [expenseResult, paymentResult, noticeResult, scheduleResult] =
        await Promise.allSettled([
          apiClient.getExpensesByMess(messId!, {
            limit: 5,
            sortBy: 'expense_date',
            sortOrder: 'desc',
          }),
          canManagePayments
            ? apiClient.getPaymentsByMess(messId!, {
                limit: 5,
                sortBy: 'created_at',
                sortOrder: 'desc',
              })
            : apiClient.getMyPayments({
                limit: 5,
                sortBy: 'created_at',
                sortOrder: 'desc',
              }),
          apiClient.getNoticesByMess(messId!, {
            limit: 5,
            sortBy: 'created_at',
            sortOrder: 'desc',
          }),
          apiClient.getBazarSchedule(messId!, year, month),
        ])

      return {
        expenses:
          expenseResult.status === 'fulfilled' && Array.isArray(expenseResult.value.data)
            ? (expenseResult.value.data as RecentExpense[]).slice(0, 5)
            : [],
        payments:
          paymentResult.status === 'fulfilled' && Array.isArray(paymentResult.value.data)
            ? paymentResult.value.data
                .filter((payment) => !payment.mess?.id || payment.mess.id === messId)
                .slice(0, 5)
            : [],
        notices:
          noticeResult.status === 'fulfilled' && Array.isArray(noticeResult.value.data)
            ? noticeResult.value.data.slice(0, 5)
            : [],
        schedule:
          scheduleResult.status === 'fulfilled' ? scheduleResult.value.data : null,
      }
    },
    DYNAMIC_SWR,
  )
}
