'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingIndicator } from '@/components/loading-indicator'
import { appHref } from '@/lib/routes'

/** Legacy deep-link fallback. More is now a drawer opened from bottom navigation. */
export default function MorePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace(appHref('/'))
  }, [router])

  return <LoadingIndicator variant="screen" label="Opening application" />
}
