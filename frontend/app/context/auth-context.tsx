'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

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
  role: UserRole
  avatar?: string
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

  // ✅ Restore user on page refresh — OUTSIDE login, at component level
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken')
    if (!savedToken) {
      setIsLoading(false)
      return
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${savedToken}` },
    })
      .then(res => res.json())
      .then(json => {
        setToken(savedToken)
        setUser(json.data)
      })
      .catch(() => localStorage.removeItem('authToken'))
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) throw new Error('Login failed')

      const data = await response.json()
      setToken(data.data.accessToken)
      setUser(data.data.user)
      localStorage.setItem('authToken', data.data.accessToken)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (name: string, email: string, phone: string, password: string, role: string) => {
    setIsLoading(true)
    try {
      console.log('Registering user with:', { name, email, phone, password, role })
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, phone, role }),
      })

      if (!response.ok) throw new Error('Registration failed')

      const data = await response.json()
      setToken(data.data.accessToken)
      setUser(data.data.user)
      localStorage.setItem('authToken', data.data.accessToken)
    } finally {
      setIsLoading(false)
    }
  }, [])


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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}