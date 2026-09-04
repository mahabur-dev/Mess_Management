'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient, type GlobalRole } from '@/lib/api-client'
import type { MessMembership } from '@/lib/api-client'

export interface User {
  id: string
  email: string
  name: string
  role: GlobalRole
  avatar_url?: string | null
  phone?: string | null
  memberships?: MessMembership[]
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
  const router = useRouter()

  useEffect(() => {
    const savedToken = localStorage.getItem('authToken')
    if (!savedToken) {
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    profileControllerRef.current = controller

    apiClient
      .getProfile(controller.signal)
      .then((response) => {
        setToken(savedToken)
        setUser(response.data as User)
      })
      .catch(() => {
        if (!controller.signal.aborted) localStorage.removeItem('authToken')
      })
      .finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    profileControllerRef.current?.abort()
    setIsSubmitting(true)
    try {
      const response = await apiClient.login(email.trim().toLowerCase(), password)
      setToken(response.data.accessToken)
      setUser(response.data.user as User)
      localStorage.setItem('authToken', response.data.accessToken)
    } finally {
      setIsSubmitting(false)
    }
  }, [])

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
    setUser(null)
    setToken(null)
    localStorage.removeItem('authToken')
    router.push('/login')
  }, [router])

  // Re-fetches full profile from server and syncs state
  const refreshUser = useCallback(async () => {
    try {
      const response = await apiClient.getProfile()
      setUser(response.data as User)
    } catch {
      // silently ignore — user stays as-is
    }
  }, [])

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
