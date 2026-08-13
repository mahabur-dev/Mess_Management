'use client'

import { useEffect, useRef } from 'react'

const DEFAULT_DISMISS_DELAY = 3000

export function useAutoDismiss(value: unknown, onDismiss: () => void, delay = DEFAULT_DISMISS_DELAY) {
  const dismissRef = useRef(onDismiss)

  useEffect(() => {
    dismissRef.current = onDismiss
  }, [onDismiss])

  useEffect(() => {
    if (!value) return

    const timeoutId = window.setTimeout(() => dismissRef.current(), delay)
    return () => window.clearTimeout(timeoutId)
  }, [delay, value])
}
