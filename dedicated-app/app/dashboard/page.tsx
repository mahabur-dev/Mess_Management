'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { LoadingIndicator } from '@/components/loading-indicator'
import { appHref } from '@/lib/routes'

/**
 * Backward-compatible entry point for old bookmarks and persisted login URLs.
 * The dedicated app's canonical dashboard route is the home page.
 */
export default function LegacyDashboardPage() {
  const router = useRouter()
  const { isLoading, user } = useAuth()

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(appHref('/'))
    }
  }, [isLoading, router, user])

  return <LoadingIndicator variant="screen" label="Loading dashboard" />
}
