'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient, type GlobalRole } from '@/lib/api-client'
import type { MessMembership } from '@/lib/api-client'
import { useLocale, type Locale } from '@/lib/i18n'

export interface User {
  id: string
  email: string
  name: string
  role: GlobalRole
  avatar_url?: string | null
  phone?: string | null
  memberships?: MessMembership[]
  preferred_locale?: Locale | null
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isSubmitting: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, phone: string, password: string) => Promise<{
    email: string
    expiresInSeconds: number
    resendAvailableInSeconds: number
  }>
  logout: () => void
  refreshUser: () => Promise<void>           // ← added
  updateUserLocally: (partial: Partial<User>) => void  // ← added (instant UI update)
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const profileControllerRef = useRef<AbortController | null>(null)
  const localeQueueRef = useRef<Promise<void>>(Promise.resolve())
  const lastLocaleRequestRef = useRef('')
  const router = useRouter()
  const { adoptLocale, changeSource, isLocaleReady, locale } = useLocale()

  const receiveUser = useCallback((nextUser: User, adoptProfileLocale = true) => {
    setUser(nextUser)
    if (adoptProfileLocale) adoptLocale(nextUser.preferred_locale)
  }, [adoptLocale])

  useEffect(() => {
    let savedToken: string | null = null
    try {
      savedToken = localStorage.getItem('authToken')
    } catch {
      // Public pages remain usable when browser storage is restricted.
    }
    if (!savedToken) {
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    profileControllerRef.current = controller

    apiClient
      .getProfile(controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return
        setToken(savedToken)
        receiveUser(response.data as User)
      })
      .catch(() => {
        if (!controller.signal.aborted) localStorage.removeItem('authToken')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [receiveUser])

  useEffect(() => {
    if (!isLocaleReady || !user) return
    const needsInitialPreference = !user.preferred_locale
    const needsUserUpdate = changeSource === 'user'
    if (!needsInitialPreference && !needsUserUpdate) return

    const requestKey = `${user.id}:${locale}`
    if (lastLocaleRequestRef.current === requestKey) return
    lastLocaleRequestRef.current = requestKey

    let active = true
    // Serialize writes so a slow earlier response cannot persist an old choice.
    localeQueueRef.current = localeQueueRef.current
      .catch(() => undefined)
      .then(() => active ? apiClient.updatePreferredLocale(locale) : undefined)
      .then((response) => {
        if (!active || !response) return
        setUser((current) => current?.id === response.data.id ? { ...current, ...response.data } : current)
      })
      .catch(() => {
        if (lastLocaleRequestRef.current === requestKey) lastLocaleRequestRef.current = ''
      })

    return () => {
      active = false
    }
  }, [changeSource, isLocaleReady, locale, user])

  const login = useCallback(async (email: string, password: string) => {
    profileControllerRef.current?.abort()
    setIsSubmitting(true)
    try {
      const response = await apiClient.login(email.trim().toLowerCase(), password)
      setToken(response.data.accessToken)
      localStorage.setItem('authToken', response.data.accessToken)
      const preferenceSaved = await apiClient.updatePreferredLocale(locale)
        .then(() => true)
        .catch(() => false)
      try {
        const profile = await apiClient.getProfile()
        receiveUser({
          ...(profile.data as User),
          ...(!preferenceSaved ? { preferred_locale: null } : {}),
        }, false)
      } catch {
        receiveUser({
          ...(response.data.user as User),
          preferred_locale: preferenceSaved ? locale : null,
        }, false)
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [locale, receiveUser])

  const register = useCallback(
    async (name: string, email: string, phone: string, password: string) => {
      setIsSubmitting(true)
      try {
        const normalizedEmail = email.trim().toLowerCase()
        const response = await apiClient.register({
          name: name.trim(),
          email: normalizedEmail,
          phone: phone.trim(),
          password,
        })
        return response.data
      } finally {
        setIsSubmitting(false)
      }
    },
    []
  )

  const logout = useCallback(() => {
    profileControllerRef.current?.abort()
    lastLocaleRequestRef.current = ''
    setUser(null)
    setToken(null)
    localStorage.removeItem('authToken')
    router.push('/login')
  }, [router])

  // Re-fetches full profile from server and syncs state
  const refreshUser = useCallback(async () => {
    try {
      const response = await apiClient.getProfile()
      receiveUser(response.data as User)
    } catch {
      // silently ignore — user stays as-is
    }
  }, [receiveUser])

  // Instantly updates specific fields locally without a network call
  const updateUserLocally = useCallback((partial: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : prev))
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        isSubmitting,
        login,
        register,
        logout,
        refreshUser,
        updateUserLocally,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
