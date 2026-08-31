'use client'

import useSWR from 'swr'
import { apiClient, type MealPattern } from '@/lib/api-client'

export type MealPatternsByMembership = Record<string, MealPattern[]>

function groupPatterns(patterns: MealPattern[]): MealPatternsByMembership {
  const result: MealPatternsByMembership = {}
  patterns.forEach((pattern) => {
    const history = result[pattern.membership_id] ?? []
    history.push(pattern)
    result[pattern.membership_id] = history
  })
  return result
}

async function fetchPatterns(messId: string, membershipIds: string[], canManage: boolean): Promise<MealPatternsByMembership> {
  if (canManage) {
    const response = await apiClient.getMealPatternsForMess(messId)
    return groupPatterns(Array.isArray(response.data) ? response.data : [])
  }
  const membershipId = membershipIds[0]
  if (!membershipId) return {}
  const response = await apiClient.getMealPatterns(membershipId)
  return { [membershipId]: Array.isArray(response.data) ? response.data : [] }
}

export function useMealPatternDashboard(messId: string | undefined, membershipIds: string[], canManage: boolean) {
  const stableIds = [...new Set(membershipIds.filter(Boolean))].sort()
  const key = messId && stableIds.length ? ['meal-pattern-dashboard', messId, canManage ? 'manager' : stableIds[0]] : null

  return useSWR<MealPatternsByMembership>(
    key,
    () => fetchPatterns(messId!, stableIds, canManage),
    {
      revalidateOnFocus: true,
      dedupingInterval: 10_000,
      keepPreviousData: true,
    },
  )
}
