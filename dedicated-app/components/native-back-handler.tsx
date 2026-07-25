'use client'

import { useEffect } from 'react'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { usePathname, useRouter } from 'next/navigation'
import { useNativeBackActions } from '@/components/native-back-actions'
import { getAppBackFallback } from '@/lib/app-permissions'
import { isAuthPath, normalizePathname, type AuthUser } from '@/lib/auth'
import { appHref } from '@/lib/routes'

type NativeBackHandlerProps = {
  user: AuthUser | null
  isLoading: boolean
  homePromptOpen?: boolean
  onCancelHomePrompt?: () => void
  onHomeBack?: () => void
}

const HOME_PATH = '/'
const LOGIN_PATH = '/login'

export function NativeBackHandler({
  user,
  isLoading,
  homePromptOpen = false,
  onCancelHomePrompt,
  onHomeBack,
}: NativeBackHandlerProps) {
  const pathname = usePathname()
  const router = useRouter()
  const normalizedPathname = normalizePathname(pathname)
  const nativeBackActions = useNativeBackActions()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let cancelled = false
    let cleanup: (() => void) | undefined

    void CapacitorApp.addListener('backButton', () => {
      if (isLoading) return

      if (nativeBackActions?.runLatestAction()) return

      if (!user) {
        if (isAuthPath(normalizedPathname)) {
          if (normalizedPathname === LOGIN_PATH) void CapacitorApp.exitApp()
          else router.replace(appHref(LOGIN_PATH))
          return
        }

        router.replace(appHref(LOGIN_PATH))
        return
      }

      if (normalizedPathname === HOME_PATH) {
        if (homePromptOpen) {
          onCancelHomePrompt?.()
          return
        }

        onHomeBack?.()
        return
      }

      if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back()
        return
      }

      router.replace(appHref(getAppBackFallback(user, normalizedPathname)))
    }).then((handle) => {
      if (cancelled) {
        void handle.remove()
        return
      }

      cleanup = () => {
        void handle.remove()
      }
    })

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [homePromptOpen, isLoading, nativeBackActions, normalizedPathname, onCancelHomePrompt, onHomeBack, router, user])

  return null
}
