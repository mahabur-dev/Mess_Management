'use client'

import { useEffect } from 'react'

export function BrowserRuntimeGuard() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    void navigator.serviceWorker.getRegistrations().then(async (registrations) => {
      if (!registrations.length) return

      await Promise.all(registrations.map((registration) => registration.unregister()))
      if ('caches' in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map((key) => caches.delete(key)))
      }
    }).catch(() => {
      // Cache cleanup is best-effort; it must never block the application.
    })
  }, [])

  return null
}
