'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LogoutConfirmDialog } from '@/components/logout-confirm-dialog'
import { NativeBackActionsProvider } from '@/components/native-back-actions'
import { NativeBackHandler } from '@/components/native-back-handler'
import { api } from '@/lib/api'
import {
  buildLoginPath,
  clearStoredToken,
  currentPathWithSearch,
  getStoredToken,
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
  login: (email: string, password: string, redirectTo?: string) => Promise<void>
  register: (name: string, email: string, phone: string, password: string, redirectTo?: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const normalizedPathname = normalizePathname(pathname)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [logoutPromptOpen, setLogoutPromptOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const clearSession = useCallback(() => {
    clearStoredToken()
    setToken(null)
    setUser(null)
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
      .then((res) => setUser(res.data))
      .catch(() => {
        clearSession()
      })
      .finally(() => setIsLoading(false))
  }, [clearSession])

  useEffect(() => {
    if (isLoading) return

    if (!user && !isAuthPath(pathname)) {
      router.replace(buildLoginPath(currentPathWithSearch(pathname)))
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

  const login = useCallback(
    async (email: string, password: string, redirectTo = readPostLoginPath()) => {
      setIsSubmitting(true)
      try {
        const normalizedEmail = email.trim().toLowerCase()
        const res = await api.login(normalizedEmail, password)
        storeToken(res.data.accessToken)
        setToken(res.data.accessToken)
        const profile = await api.getProfile()
        setUser(profile.data)
        router.replace(redirectTo)
      } finally {
        setIsSubmitting(false)
      }
    },
    [router]
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
        await login(normalizedEmail, password, redirectTo)
      } finally {
        setIsSubmitting(false)
      }
    },
    [login]
  )

  const logout = useCallback(async () => {
    setIsLoggingOut(true)
    try {
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
    setUser(res.data)
  }, [])

  const openLogoutPrompt = useCallback(() => {
    setLogoutPromptOpen(true)
  }, [])

  const closeLogoutPrompt = useCallback(() => {
    setLogoutPromptOpen(false)
  }, [])

  const value = useMemo(
    () => ({ user, token, isAuthenticated: Boolean(user), isLoading, isSubmitting, login, register, logout, refresh }),
    [user, token, isLoading, isSubmitting, login, register, logout, refresh]
  )

  return (
    <AuthContext.Provider value={value}>
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
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside Providers')
  return ctx
}
