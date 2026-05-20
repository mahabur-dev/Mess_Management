'use client'

import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient, type GlobalRole } from '@/lib/api-client'
import type { MessMembership } from '@/lib/api-client'

export enum UserRole {
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
  ORGANIZER = 'ORGANIZER',
  MEMBER = 'MEMBER',
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole | GlobalRole
  avatar_url?: string | null
  phone?: string | null
  memberships?: MessMembership[]
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, phone: string, password: string, role: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const savedToken = localStorage.getItem('authToken')
    if (!savedToken) {
      setIsLoading(false)
      return
    }

    apiClient
      .getProfile()
      .then((response) => {
        setToken(savedToken)
        setUser(response.data as User)
      })
      .catch(() => localStorage.removeItem('authToken'))
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await apiClient.login(email, password)
      setToken(response.data.accessToken)
      setUser(response.data.user as User)
      localStorage.setItem('authToken', response.data.accessToken)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(
    async (name: string, email: string, phone: string, password: string, role: string) => {
      setIsLoading(true)
      try {
        await apiClient.register({ name, email, phone, password, role: role as GlobalRole })
        await login(email, password)
      } finally {
        setIsLoading(false)
      }
    },
    [login]
  )

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('authToken')
    router.push('/login')
  }, [router])

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
