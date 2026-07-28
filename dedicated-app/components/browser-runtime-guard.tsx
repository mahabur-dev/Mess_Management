'use client'

import { useEffect } from 'react'

export function BrowserRuntimeGuard() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          registrations.forEach((registration) => {
            void registration.unregister()
          })
        })
        .catch(() => {
          // A stale service worker must never block local development.
        })
    }

    if ('caches' in window) {
      void caches
        .keys()
        .then((keys) => {
          keys.forEach((key) => {
            void caches.delete(key)
          })
        })
        .catch(() => {
          // Cache cleanup is best-effort only.
        })
    }
  }, [])

  return null
}
