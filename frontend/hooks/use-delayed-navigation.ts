'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type NavigationMode = 'push' | 'replace'

/** Schedules one redirect and guarantees timer cleanup when the page unmounts. */
export function useDelayedNavigation() {
  const router = useRouter()
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
  }, [])

  return useCallback((href: string, delayMs: number, mode: NavigationMode = 'push') => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null
      if (mode === 'replace') router.replace(href)
      else router.push(href)
    }, delayMs)
  }, [router])
}
