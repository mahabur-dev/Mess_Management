'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { BrowserRuntimeGuard } from '@/components/browser-runtime-guard'
import { LogoutConfirmDialog } from '@/components/logout-confirm-dialog'
import { NativeBackActionsProvider } from '@/components/native-back-actions'
import { NativeBackHandler } from '@/components/native-back-handler'
import { NativeStatusBarProvider } from '@/components/native-status-bar'
import { LoadingIndicator } from '@/components/loading-indicator'
import { useLocale, useTranslations } from '@/lib/i18n'
import { api } from '@/lib/api'
import { signInWithNativeGoogle, signOutNativeGoogle } from '@/lib/native-google-auth'
import {
  initializeNativePush,
  nativePushActionEventName,
  nativePushReceivedEventName,
  shutdownNativePush,
  type NativePushActionDetail,
} from '@/lib/native-push'
import {
  buildLoginPath,
  buildOnboardingPath,
  clearStoredToken,
  currentPathWithSearch,
  getStoredToken,
  hasCompletedOnboarding,
  isAuthPath,
  normalizePathname,
  readPostLoginPath,
  storeToken,
  type AuthUser,
} from '@/lib/auth'

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isSubmitting: boolean
  unreadNotificationCount: number
  login: (email: string, password: string, redirectTo?: string) => Promise<void>
  loginWithGoogle: (redirectTo?: string) => Promise<void>
  register: (name: string, email: string, phone: string, password: string, redirectTo?: string) => Promise<void>
  logout: () => Promise<void>
  requestLogout: () => void
  refresh: () => Promise<void>
  refreshUnreadNotifications: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const normalizedPathname = normalizePathname(pathname)
  const { adoptLocale, changeSource, isLocaleReady, locale } = useLocale()
  const common = useTranslations('common')
  const communication = useTranslations('communication')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [logoutPromptOpen, setLogoutPromptOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [hasMounted, setHasMounted] = useState(false)

  const receiveUser = useCallback((nextUser: AuthUser, adoptProfileLocale = true) => {
    setUser(nextUser)
    if (adoptProfileLocale) adoptLocale(nextUser.preferred_locale)
  }, [adoptLocale])

  const clearSession = useCallback(() => {
    clearStoredToken()
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    const saved = getStoredToken()
    if (!saved) {
      setIsLoading(false)
      return
    }

    setToken(saved)
    api
      .getProfile()
      .then((res) => receiveUser(res.data))
      .catch(() => {
        clearSession()
      })
      .finally(() => setIsLoading(false))
  }, [clearSession, receiveUser])

  useEffect(() => {
    if (!isLocaleReady || !user) return
    const needsInitialPreference = !user.preferred_locale
    const needsUserUpdate = changeSource === 'user' && user.preferred_locale !== locale
    if (!needsInitialPreference && !needsUserUpdate) return

    let active = true
    api.updatePreferredLocale(locale)
      .then((response) => {
        if (!active) return
        setUser((current) => current?.id === response.data.id ? { ...current, ...response.data } : current)
      })
      .catch(() => undefined)

    return () => {
      active = false
    }
  }, [changeSource, isLocaleReady, locale, user])

  useEffect(() => {
    if (isLoading) return

    if (!user && !isAuthPath(pathname)) {
      const nextPath = currentPathWithSearch(pathname)
      router.replace(hasCompletedOnboarding() ? buildLoginPath(nextPath) : buildOnboardingPath(nextPath))
      return
    }

    if (!user && normalizedPathname === '/login' && !hasCompletedOnboarding()) {
      router.replace(buildOnboardingPath(readPostLoginPath()))
      return
    }

    if (user && normalizedPathname === '/onboarding') {
      router.replace('/')
      return
    }

    if (user && normalizedPathname === '/login') {
      router.replace(readPostLoginPath())
    }
  }, [isLoading, normalizedPathname, pathname, router, user])

  useEffect(() => {
    const handleAuthExpired = () => {
      clearSession()
      router.replace('/login')
    }

    window.addEventListener('auth:expired', handleAuthExpired)
    return () => window.removeEventListener('auth:expired', handleAuthExpired)
  }, [clearSession, router])

  useEffect(() => {
    if (!user) return
    void initializeNativePush(user.id, {
      fallbackTitle: common('appName'),
      fallbackBody: communication('newNotificationFallback'),
      channelName: communication('notificationChannelName'),
      channelDescription: communication('notificationChannelDescription'),
    })

    return () => {
      void shutdownNativePush()
    }
  }, [communication, common, locale, user?.id])

  useEffect(() => {
    const handlePushAction = (event: Event) => {
      const detail = (event as CustomEvent<NativePushActionDetail>).detail
      const rawUrl = detail?.url || '/'
      const parsedUrl = new URL(rawUrl, window.location.origin)
      const dedicatedPath = parsedUrl.pathname.replace(/^\/dashboard(?=\/|$)/, '') || '/'
      const route = `${dedicatedPath}${parsedUrl.search}${parsedUrl.hash}`
      router.push(route)
    }

    window.addEventListener(nativePushActionEventName(), handlePushAction)
    return () => window.removeEventListener(nativePushActionEventName(), handlePushAction)
  }, [router])

  const refreshUnreadNotifications = useCallback(async () => {
    if (!user?.id) {
      setUnreadNotificationCount(0)
      return
    }

    try {
      const response = await api.getUnreadNotificationCount()
      setUnreadNotificationCount(Math.max(0, Number(response.data?.count ?? 0)))
    } catch {
      // Keep the last known badge during a transient network failure.
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) {
      setUnreadNotificationCount(0)
      return
    }

    void refreshUnreadNotifications()
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void refreshUnreadNotifications()
    }
    const refreshAfterPush = () => void refreshUnreadNotifications()
    const interval = window.setInterval(() => void refreshUnreadNotifications(), 30_000)

    window.addEventListener('focus', refreshAfterPush)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    window.addEventListener(nativePushReceivedEventName(), refreshAfterPush)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', refreshAfterPush)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
      window.removeEventListener(nativePushReceivedEventName(), refreshAfterPush)
    }
  }, [refreshUnreadNotifications, user?.id])

  const login = useCallback(
    async (email: string, password: string, redirectTo = readPostLoginPath()) => {
      setIsSubmitting(true)
      try {
        const normalizedEmail = email.trim().toLowerCase()
        const res = await api.login(normalizedEmail, password)
        storeToken(res.data.accessToken)
        setToken(res.data.accessToken)
        // A locale explicitly chosen on Login is the latest user intent. Save
        // it before loading the profile so an older database preference cannot
        // replace the selected language during the first authenticated render.
        await api.updatePreferredLocale(locale).catch(() => undefined)
        const profile = await api.getProfile()
        receiveUser(profile.data, false)
        router.replace(redirectTo)
      } finally {
        setIsSubmitting(false)
      }
    },
    [locale, receiveUser, router]
  )

  const register = useCallback(
    async (name: string, email: string, phone: string, password: string, redirectTo = '/') => {
      setIsSubmitting(true)
      try {
        const normalizedEmail = email.trim().toLowerCase()
        await api.register({
          name: name.trim(),
          email: normalizedEmail,
          phone: phone.trim() || undefined,
          password,
          role: 'MEMBER',
        })
        // Registration must not create an authenticated session. The user signs in explicitly.
        clearSession()
        router.replace(buildLoginPath(redirectTo))
      } finally {
        setIsSubmitting(false)
      }
    },
    [clearSession, router]
  )

  const loginWithGoogle = useCallback(
    async (redirectTo = readPostLoginPath()) => {
      setIsSubmitting(true)
      try {
        const firebaseIdToken = await signInWithNativeGoogle()
        const res = await api.googleLogin(firebaseIdToken)
        storeToken(res.data.accessToken)
        setToken(res.data.accessToken)
        await api.updatePreferredLocale(locale).catch(() => undefined)
        const profile = await api.getProfile()
        receiveUser(profile.data, false)
        router.replace(redirectTo)
      } catch (error) {
        await signOutNativeGoogle().catch(() => undefined)
        throw error
      } finally {
        setIsSubmitting(false)
      }
    },
    [locale, receiveUser, router]
  )

  const logout = useCallback(async () => {
    setIsLoggingOut(true)
    try {
      await shutdownNativePush()
      await signOutNativeGoogle().catch(() => undefined)
      await api.logout()
    } catch {
      // Local logout must still complete if the network or cookie clear fails.
    } finally {
      setLogoutPromptOpen(false)
      clearSession()
      setIsLoggingOut(false)
      router.replace('/login')
    }
  }, [clearSession, router])

  const refresh = useCallback(async () => {
    const res = await api.getProfile()
    receiveUser(res.data)
  }, [receiveUser])

  const openLogoutPrompt = useCallback(() => {
    setLogoutPromptOpen(true)
  }, [])

  const closeLogoutPrompt = useCallback(() => {
    setLogoutPromptOpen(false)
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user),
      isLoading,
      isSubmitting,
      unreadNotificationCount,
      login,
      loginWithGoogle,
      register,
      logout,
      requestLogout: openLogoutPrompt,
      refresh,
      refreshUnreadNotifications,
    }),
    [user, token, isLoading, isSubmitting, unreadNotificationCount, login, loginWithGoogle, register, logout, openLogoutPrompt, refresh, refreshUnreadNotifications]
  )

  if (!hasMounted) {
    return (
      <AuthContext.Provider value={value}>
        <NativeStatusBarProvider>
          <LoadingIndicator variant="screen" label={common('loadingApplication')} />
        </NativeStatusBarProvider>
      </AuthContext.Provider>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      <NativeStatusBarProvider>
        <BrowserRuntimeGuard />
        <NativeBackActionsProvider>
          <NativeBackHandler
            user={user}
            isLoading={isLoading}
            homePromptOpen={logoutPromptOpen}
            onCancelHomePrompt={closeLogoutPrompt}
            onHomeBack={openLogoutPrompt}
          />
          <LogoutConfirmDialog
            open={logoutPromptOpen}
            busy={isLoggingOut}
            onCancel={closeLogoutPrompt}
            onConfirm={() => {
              void logout()
            }}
          />
          {children}
        </NativeBackActionsProvider>
      </NativeStatusBarProvider>
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside Providers')
  return ctx
}
