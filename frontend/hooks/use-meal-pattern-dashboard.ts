'use client'

import useSWR from 'swr'
import { apiClient, type MealPattern } from '@/lib/api-client'

export type MealPatternsByMembership = Record<string, MealPattern[]>

async function fetchPatternsInBatches(membershipIds: string[]): Promise<MealPatternsByMembership> {
  const result: MealPatternsByMembership = {}
  const batchSize = 4

  for (let index = 0; index < membershipIds.length; index += batchSize) {
    const batch = membershipIds.slice(index, index + batchSize)
    const responses = await Promise.all(batch.map(async (membershipId) => {
      const response = await apiClient.getMealPatterns(membershipId)
      return [membershipId, Array.isArray(response.data) ? response.data : []] as const
    }))
    responses.forEach(([membershipId, patterns]) => {
      result[membershipId] = patterns
    })
  }

  return result
}

export function useMealPatternDashboard(membershipIds: string[]) {
  const stableIds = [...new Set(membershipIds.filter(Boolean))].sort()
  const key = stableIds.length ? ['meal-pattern-dashboard', stableIds.join(',')] : null

  return useSWR<MealPatternsByMembership>(
    key,
    () => fetchPatternsInBatches(stableIds),
    {
      revalidateOnFocus: true,
      dedupingInterval: 10_000,
      keepPreviousData: true,
    },
  )
}
