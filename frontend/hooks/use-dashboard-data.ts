import useSWR from 'swr'
import { swrFetcher } from '@/lib/swr-fetcher'
import { apiClient } from '@/lib/api-client'

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
export function useMesses(enabled = true) {
  return useSWR(enabled ? 'messes' : null, () => swrFetcher(() => apiClient.getMesses()), STATIC_SWR)
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
