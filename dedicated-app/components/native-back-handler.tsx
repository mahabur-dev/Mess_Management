'use client'

import { useEffect } from 'react'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { usePathname, useRouter } from 'next/navigation'
import { getDefaultAppPath } from '@/lib/app-permissions'
import { isAuthPath, normalizePathname, type AuthUser } from '@/lib/auth'

type NativeBackHandlerProps = {
  user: AuthUser | null
  isLoading: boolean
  homePromptOpen?: boolean
  onCancelHomePrompt?: () => void
  onHomeBack?: () => void
}

const HOME_PATH = '/'
const LOGIN_PATH = '/login'

export function NativeBackHandler({ user, isLoading, homePromptOpen = false, onCancelHomePrompt, onHomeBack }: NativeBackHandlerProps) {
  const pathname = usePathname()
  const router = useRouter()
  const normalizedPathname = normalizePathname(pathname)

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let cancelled = false
    let cleanup: (() => void) | undefined

    void CapacitorApp.addListener('backButton', () => {
      if (isLoading) return

      if (!user) {
        if (isAuthPath(normalizedPathname)) {
          if (normalizedPathname === LOGIN_PATH) void CapacitorApp.exitApp()
          else router.replace(LOGIN_PATH)
          return
        }

        router.replace(LOGIN_PATH)
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

      router.replace(getDefaultAppPath(user))
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
  }, [homePromptOpen, isLoading, normalizedPathname, onCancelHomePrompt, onHomeBack, router, user])

  return null
}
