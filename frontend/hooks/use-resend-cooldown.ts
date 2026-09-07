'use client'

import { useCallback, useEffect, useState } from 'react'

function secondsUntil(timestamp: number) {
  return Math.max(0, Math.ceil((timestamp - Date.now()) / 1000))
}

/** Persists OTP resend cooldowns across route changes and refreshes. */
export function useResendCooldown(storageKey: string) {
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  const synchronize = useCallback(() => {
    const resendAt = Number(sessionStorage.getItem(storageKey) || 0)
    const remaining = secondsUntil(resendAt)
    setRemainingSeconds(remaining)
    if (remaining === 0 && resendAt) sessionStorage.removeItem(storageKey)
  }, [storageKey])

  useEffect(() => {
    synchronize()
    const timer = window.setInterval(synchronize, 1000)
    return () => window.clearInterval(timer)
  }, [synchronize])

  const startCooldown = useCallback((seconds: number) => {
    const safeSeconds = Math.max(0, Math.ceil(seconds))
    sessionStorage.setItem(storageKey, String(Date.now() + safeSeconds * 1000))
    setRemainingSeconds(safeSeconds)
  }, [storageKey])

  const clearCooldown = useCallback(() => {
    sessionStorage.removeItem(storageKey)
    setRemainingSeconds(0)
  }, [storageKey])

  return { remainingSeconds, startCooldown, clearCooldown }
}
