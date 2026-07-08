'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

type User = {
  id: string
  name: string
  email: string
  phone?: string | null
  role?: string
  memberships?: Array<{ mess_id: string; role: string; mess?: { id: string; name: string } }>
}

type AuthContextValue = {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('authToken')
    if (!saved) {
      setIsLoading(false)
      return
    }

    setToken(saved)
    api
      .getProfile()
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('authToken')
        setToken(null)
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    const handleAuthExpired = () => {
      setToken(null)
      setUser(null)
      router.push('/login')
    }

    window.addEventListener('auth:expired', handleAuthExpired)
    return () => window.removeEventListener('auth:expired', handleAuthExpired)
  }, [router])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password)
    localStorage.setItem('authToken', res.data.accessToken)
    setToken(res.data.accessToken)
    const profile = await api.getProfile()
    setUser(profile.data)
    router.push('/')
  }, [router])

  const logout = useCallback(() => {
    localStorage.removeItem('authToken')
    setToken(null)
    setUser(null)
    router.push('/login')
  }, [router])

  const refresh = useCallback(async () => {
    const res = await api.getProfile()
    setUser(res.data)
  }, [])

  const value = useMemo(
    () => ({ user, token, isLoading, login, logout, refresh }),
    [user, token, isLoading, login, logout, refresh]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside Providers')
  return ctx
}
