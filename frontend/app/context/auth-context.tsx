// 'use client'

// import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

// export enum UserRole {
//   USER = 'user',
//   MANAGER = 'manager',
//   ADMIN = 'admin',
// }

// export interface User {
//   id: string
//   email: string
//   name: string
//   role: UserRole
//   avatar?: string
// }

// interface AuthContextType {
//   user: User | null
//   token: string | null
//   isAuthenticated: boolean
//   isLoading: boolean
//   login: (email: string, password: string) => Promise<void>
//   register: (email: string, password: string, name: string) => Promise<void>
//   logout: () => void
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined)

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<User | null>(null)
//   const [token, setToken] = useState<string | null>(null)
//   const [isLoading, setIsLoading] = useState(false)

//   const login = useCallback(async (email: string, password: string) => {
//     setIsLoading(true)
//     try {
//       // TODO: Replace with actual API call to NestJS backend
//       const response = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password }),
//       })

//       if (!response.ok) {
//         throw new Error('Login failed')
//       }

//       const data = await response.json()
//       setToken(data.token)
//       setUser(data.user)
//       localStorage.setItem('authToken', data.token)
//     } finally {
//       setIsLoading(false)
//     }
//   }, [])

//   const register = useCallback(async (email: string, password: string, name: string) => {
//     setIsLoading(true)
//     try {
//       // TODO: Replace with actual API call to NestJS backend
//       const response = await fetch('/api/auth/register', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password, name }),
//       })

//       if (!response.ok) {
//         throw new Error('Registration failed')
//       }

//       const data = await response.json()
//       setToken(data.token)
//       setUser(data.user)
//       localStorage.setItem('authToken', data.token)
//     } finally {
//       setIsLoading(false)
//     }
//   }, [])

//   const logout = useCallback(() => {
//     setUser(null)
//     setToken(null)
//     localStorage.removeItem('authToken')
//   }, [])

//   return (
//     <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, register, logout }}>
//       {children}
//     </AuthContext.Provider>
//   )
// }

// export function useAuth() {
//   const context = useContext(AuthContext)
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider')
//   }
//   return context
// }


'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export enum UserRole {
  USER = 'user',
  MANAGER = 'manager',
  ADMIN = 'admin',
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
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Demo mode: Create mock user based on email
      if (email && password) {
        const mockToken = 'demo_token_' + Date.now()
        const roles: UserRole[] = [UserRole.USER, UserRole.MANAGER, UserRole.ADMIN]
        const randomRole = roles[Math.floor(Math.random() * roles.length)]
        
        const mockUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          email,
          name: email.split('@')[0],
          role: randomRole,
          avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=7C3AED&color=fff`,
        }
        
        setToken(mockToken)
        setUser(mockUser)
        localStorage.setItem('authToken', mockToken)
        localStorage.setItem('user', JSON.stringify(mockUser))
        return
      }
      throw new Error('Invalid email or password')
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }, [])

  const register = useCallback(async (email: string, password: string, name: string) => {
    setIsLoading(true)
    try {
      // Demo mode: Create mock user
      if (email && password && name) {
        const mockToken = 'demo_token_' + Date.now()
        const mockUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          email,
          name,
          role: UserRole.USER,
          avatar: `https://ui-avatars.com/api/?name=${name}&background=7C3AED&color=fff`,
        }
        
        setToken(mockToken)
        setUser(mockUser)
        localStorage.setItem('authToken', mockToken)
        localStorage.setItem('user', JSON.stringify(mockUser))
        return
      }
      throw new Error('All fields required')
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('authToken')
  }, [])

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
