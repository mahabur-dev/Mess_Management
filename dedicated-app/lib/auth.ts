'use client'

import { appHref } from './routes'

export const AUTH_TOKEN_KEY = 'authToken'

export type GlobalRole = 'ADMIN' | 'MANAGER' | 'MEMBER' | 'ORGANIZER'
export type MembershipRole = 'MANAGER' | 'MEMBER'

export type MessMembership = {
  id?: string
  mess_id?: string
  user_id?: string
  role: MembershipRole | string
  joined_at?: string
  left_at?: string | null
  is_active?: boolean
  mess?: {
    id: string
    name: string
    address?: string | null
  }
}

export type AuthUser = {
  id: string
  name: string
  email: string
  phone?: string | null
  avatar_url?: string | null
  role?: GlobalRole | string
  memberships?: MessMembership[]
}

const AUTH_PATHS = new Set(['/login', '/signup', '/register', '/forget_password', '/verify_otp', '/reset_password'])

export function normalizePathname(pathname: string) {
  const pathOnly = (pathname || '/').split('?')[0]?.split('#')[0] || '/'
  if (pathOnly === '/') return '/'
  return pathOnly.replace(/\/+$/, '') || '/'
}

export function getStoredToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function storeToken(token: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function clearStoredToken() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

export function isAuthPath(pathname: string) {
  return AUTH_PATHS.has(normalizePathname(pathname))
}

export function buildLoginPath(nextPath: string) {
  const canonicalNextPath = appHref(nextPath)
  if (!canonicalNextPath || canonicalNextPath === '/' || isAuthPath(canonicalNextPath)) return '/login'
  return `/login?next=${encodeURIComponent(canonicalNextPath)}`
}

export function currentPathWithSearch(fallback: string) {
  if (typeof window === 'undefined') return fallback
  return `${window.location.pathname}${window.location.search}`
}

export function readPostLoginPath(fallback = '/') {
  if (typeof window === 'undefined') return fallback
  const nextPath = new URLSearchParams(window.location.search).get('next')
  if (!nextPath || !nextPath.startsWith('/') || nextPath.startsWith('//') || isAuthPath(nextPath)) return fallback
  return appHref(nextPath)
}
