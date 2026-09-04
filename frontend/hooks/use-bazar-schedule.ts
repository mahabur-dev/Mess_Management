'use client'

import useSWR from 'swr'
import {
  ApiError,
  apiClient,
  type BazarReleaseRequest,
  type BazarSchedule,
  type BazarScheduleHistory,
  type BazarScheduleSettings,
  type BazarSwapRequest,
} from '@/lib/api-client'
import { swrFetcher } from '@/lib/swr-fetcher'

async function optionalResource<T>(request: () => Promise<{ data: T }>) {
  try {
    const response = await request()
    return response.data
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) return null
    throw error
  }
}

export function useBazarSchedule(messId: string | undefined, year: number, month: number) {
  const settings = useSWR<BazarScheduleSettings | null>(
    messId ? ['bazar-settings', messId] : null,
    () => optionalResource(() => apiClient.getBazarScheduleSettings(messId!)),
    { revalidateOnFocus: false },
  )

  const schedule = useSWR<BazarSchedule | null>(
    messId ? ['bazar-schedule', messId, year, month] : null,
    () => optionalResource(() => apiClient.getBazarSchedule(messId!, year, month)),
    { revalidateOnFocus: true, dedupingInterval: 5_000 },
  )

  const swaps = useSWR<BazarSwapRequest[]>(
    messId ? ['bazar-swaps', messId] : null,
    () => swrFetcher(() => apiClient.getBazarSwapRequests(messId!)),
    { revalidateOnFocus: true, dedupingInterval: 5_000 },
  )

  const releases = useSWR<BazarReleaseRequest[]>(
    messId ? ['bazar-releases', messId] : null,
    () => swrFetcher(() => apiClient.getBazarReleaseRequests(messId!)),
    { revalidateOnFocus: true, dedupingInterval: 5_000 },
  )

  const history = useSWR<BazarScheduleHistory[]>(
    messId ? ['bazar-history', messId] : null,
    () => swrFetcher(() => apiClient.getBazarScheduleHistory(messId!)),
    { revalidateOnFocus: false },
  )

  const refresh = async () => {
    await Promise.all([
      schedule.mutate(),
      swaps.mutate(),
      releases.mutate(),
      history.mutate(),
    ])
  }

  return {
    settings: settings.data,
    schedule: schedule.data,
    swaps: swaps.data ?? [],
    releases: releases.data ?? [],
    history: history.data ?? [],
    isLoading:
      settings.isLoading ||
      schedule.isLoading ||
      swaps.isLoading ||
      releases.isLoading,
    error: settings.error ?? schedule.error ?? swaps.error ?? releases.error,
    refresh,
    refreshSettings: settings.mutate,
  }
}
