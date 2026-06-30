import type { BackendResponse } from './api-client'

/**
 * Generic SWR fetcher for typed API client calls.
 * Each fetcher calls the apiClient method and returns `res.data`.
 */
export async function swrFetcher<T>(fetcherFn: () => Promise<BackendResponse<T>>): Promise<T> {
  const res = await fetcherFn()
  return res.data
}