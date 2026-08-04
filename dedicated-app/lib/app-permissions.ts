'use client'

import type { ComponentType } from 'react'
import {
  Bell,
  ClipboardList,
  DoorOpen,
  House,
  Landmark,
  LayoutGrid,
  MessageSquareWarning,
  ReceiptText,
  Settings,
  ShieldCheck,
  User,
  Users,
  UtensilsCrossed,
  Wallet2,
  Zap,
  type LucideProps,
} from 'lucide-react'
import { normalizePathname, type AuthUser, type MessMembership } from './auth'

export type AppIcon = ComponentType<LucideProps>
export type AccessLevel = 'public' | 'mess' | 'manager'

export type AppRouteItem = {
  href: string
  label: string
  icon: AppIcon
  access: AccessLevel
  exact?: boolean
}

const managerGlobalRoles = new Set(['ADMIN', 'MANAGER'])

function normalizeRole(role?: string | null) {
  return String(role ?? '').toUpperCase()
}

export function getActiveMemberships(user: AuthUser | null | undefined): MessMembership[] {
  return (user?.memberships ?? []).filter((membership) => membership.is_active !== false)
}

export function hasActiveMess(user: AuthUser | null | undefined) {
  return getActiveMemberships(user).some((membership) => Boolean(membership.mess_id || membership.mess?.id))
}

export function canManageMess(user: AuthUser | null | undefined) {
  if (!user) return false
  if (managerGlobalRoles.has(normalizeRole(user.role))) return true
  return getActiveMemberships(user).some((membership) => normalizeRole(membership.role) === 'MANAGER')
}

export function canAccessLevel(user: AuthUser | null | undefined, access: AccessLevel) {
  if (access === 'public') return true
  if (access === 'manager') return canManageMess(user)
  return hasActiveMess(user) || canManageMess(user)
}

const protectedRoutes: AppRouteItem[] = [
  { href: '/create-mess', label: 'Create Mess', icon: House, access: 'public', exact: true },
  { href: '/request-mess', label: 'Request Mess', icon: DoorOpen, access: 'public', exact: true },
  { href: '/members', label: 'Members', icon: Users, access: 'manager' },
  { href: '/add-member', label: 'Add Member', icon: Users, access: 'manager', exact: true },
  { href: '/member-details', label: 'Member Details', icon: User, access: 'mess', exact: true },
  { href: '/edit-member', label: 'Edit Member', icon: Users, access: 'manager' },
  { href: '/expenses', label: 'Expenses', icon: ReceiptText, access: 'mess' },
  { href: '/add-expense', label: 'Add Expense', icon: ReceiptText, access: 'mess', exact: true },
  { href: '/add-utility', label: 'Add Utility', icon: Zap, access: 'mess', exact: true },
  { href: '/expense-details', label: 'Expense Details', icon: ReceiptText, access: 'mess' },
  { href: '/edit-expense', label: 'Edit Expense', icon: ReceiptText, access: 'mess' },
  { href: '/deposits', label: 'Deposits', icon: Landmark, access: 'manager' },
  { href: '/edit-deposit', label: 'Edit Deposit', icon: Landmark, access: 'manager' },
  { href: '/notices', label: 'Notices', icon: Bell, access: 'mess' },
  { href: '/meals/time', label: 'Set Meal Time', icon: UtensilsCrossed, access: 'manager' },
  { href: '/meals/members', label: 'Member Meals', icon: UtensilsCrossed, access: 'manager' },
  { href: '/meals/member-meal', label: 'Edit Member Meal', icon: UtensilsCrossed, access: 'manager' },
  { href: '/meals/manager', label: 'Manager Controls', icon: UtensilsCrossed, access: 'manager' },
  { href: '/meals/locks', label: 'Lock Meals', icon: UtensilsCrossed, access: 'manager' },
  { href: '/meals/settings', label: 'Meal Settings', icon: UtensilsCrossed, access: 'manager' },
  { href: '/meals/details', label: 'Meal Details', icon: UtensilsCrossed, access: 'mess' },
  { href: '/meals/my', label: 'My Meal', icon: UtensilsCrossed, access: 'mess' },
  { href: '/meals', label: 'Meals', icon: UtensilsCrossed, access: 'mess' },
  { href: '/add-meal', label: 'Add Meal', icon: UtensilsCrossed, access: 'mess', exact: true },
  { href: '/monthly-bill', label: 'Monthly Bill', icon: ClipboardList, access: 'mess' },
  { href: '/edit-monthly-bill', label: 'Edit Bill', icon: ClipboardList, access: 'manager' },
  { href: '/payments', label: 'Deposits', icon: Landmark, access: 'mess' },
  { href: '/edit-payment', label: 'Edit Deposit', icon: Landmark, access: 'mess' },
  { href: '/complaints', label: 'Complaints', icon: MessageSquareWarning, access: 'mess' },
  { href: '/edit-complaint', label: 'Edit Complaint', icon: MessageSquareWarning, access: 'manager' },
  { href: '/profile', label: 'Profile', icon: User, access: 'public' },
  { href: '/settings', label: 'Settings', icon: Settings, access: 'public' },
  { href: '/edit-profile', label: 'Edit Profile', icon: User, access: 'public', exact: true },
  { href: '/change-password', label: 'Change Password', icon: ShieldCheck, access: 'public', exact: true },
  { href: '/mess-management', label: 'Mess Management', icon: Settings, access: 'manager' },
]

export const managerQuickActions: AppRouteItem[] = [
  { href: '/meals', label: 'Meals', icon: UtensilsCrossed, access: 'mess' },
  { href: '/expenses', label: 'Expenses', icon: Wallet2, access: 'manager' },
  { href: '/payments', label: 'Deposits', icon: Landmark, access: 'mess' },
  { href: '/monthly-bill', label: 'Monthly Bill', icon: ClipboardList, access: 'mess' },
  { href: '/notices', label: 'Notices', icon: Bell, access: 'manager' },
  { href: '/members', label: 'Members', icon: Users, access: 'manager' },
]

export const memberQuickActions: AppRouteItem[] = [
  { href: '/meals', label: 'Meals', icon: UtensilsCrossed, access: 'mess' },
  { href: '/expenses', label: 'Expenses', icon: ReceiptText, access: 'mess' },
  { href: '/payments', label: 'Deposits', icon: Landmark, access: 'mess' },
  { href: '/notices', label: 'Notices', icon: Bell, access: 'mess' },
  { href: '/complaints', label: 'Complaints', icon: MessageSquareWarning, access: 'mess' },
  { href: '/monthly-bill', label: 'Monthly Bill', icon: ClipboardList, access: 'mess' },
]

export function getHomeQuickActions(user: AuthUser | null | undefined) {
  const source = canManageMess(user) ? managerQuickActions : hasActiveMess(user) ? memberQuickActions : [{ href: '/profile', label: 'Profile', icon: User, access: 'public' as const }]
  return source.filter((item) => canAccessLevel(user, item.access))
}

export function getBottomTabs(user: AuthUser | null | undefined): AppRouteItem[] {
  if (!hasActiveMess(user) && !canManageMess(user)) {
    const onboardingTabs: AppRouteItem[] = [
      { href: '/', label: 'Home', icon: House, access: 'public', exact: true },
      { href: '/profile', label: 'Profile', icon: User, access: 'public' },
      { href: '/settings', label: 'Settings', icon: Settings, access: 'public' },
      { href: '/more', label: 'More', icon: LayoutGrid, access: 'public', exact: true },
    ]
    return onboardingTabs
  }

  const primary: AppRouteItem = canManageMess(user)
    ? { href: '/members', label: 'Members', icon: Users, access: 'manager' }
    : { href: '/expenses', label: 'Expenses', icon: ReceiptText, access: 'mess' }

  const tabs: AppRouteItem[] = [
    { href: '/', label: 'Home', icon: House, access: 'public', exact: true },
    primary,
    { href: '/meals', label: 'Meals', icon: UtensilsCrossed, access: 'mess' },
    { href: '/more', label: 'More', icon: LayoutGrid, access: 'public', exact: true },
  ]

  return tabs.filter((item) => canAccessLevel(user, item.access))
}

const onboardingTabPaths = new Set(['/', '/profile', '/settings', '/edit-profile', '/change-password', '/more'])

/**
 * Keeps primary onboarding navigation available while a user has no active
 * mess. Connected users retain each screen's explicit navigation choice.
 */
export function shouldShowDefaultBottomNavigation(user: AuthUser | null | undefined, pathname: string) {
  const normalizedPathname = normalizePathname(pathname)
  if (normalizedPathname === '/' || normalizedPathname === '/more') return true
  return !hasActiveMess(user) && onboardingTabPaths.has(normalizedPathname)
}

export function getMoreLinks(user: AuthUser | null | undefined): AppRouteItem[] {
  const managerLinks: AppRouteItem[] = [
    { href: '/members', label: 'Members', icon: Users, access: 'manager' },
    { href: '/meals', label: 'Meal Sheet', icon: UtensilsCrossed, access: 'mess' },
    { href: '/expenses', label: 'Bazar/Expenses', icon: ReceiptText, access: 'mess' },
    { href: '/payments', label: 'Deposits', icon: Landmark, access: 'mess' },
    { href: '/monthly-bill', label: 'Monthly Bills', icon: ClipboardList, access: 'mess' },
    { href: '/notices', label: 'Notices', icon: Bell, access: 'mess' },
    { href: '/complaints', label: 'Complaints', icon: MessageSquareWarning, access: 'mess' },
    { href: '/mess-management', label: 'Mess Management', icon: Settings, access: 'manager' },
    { href: '/settings', label: 'Settings', icon: ShieldCheck, access: 'public' },
  ]

  const memberLinks: AppRouteItem[] = [
    { href: '/meals', label: 'My Meals', icon: UtensilsCrossed, access: 'mess' },
    { href: '/expenses', label: 'My Expenses', icon: ReceiptText, access: 'mess' },
    { href: '/monthly-bill', label: 'Monthly Bills', icon: ClipboardList, access: 'mess' },
    { href: '/payments', label: 'Deposits', icon: Landmark, access: 'mess' },
    { href: '/notices', label: 'Notices', icon: Bell, access: 'mess' },
    { href: '/complaints', label: 'Complaints', icon: MessageSquareWarning, access: 'mess' },
    { href: '/profile', label: 'Profile', icon: User, access: 'public' },
    { href: '/settings', label: 'Settings', icon: ShieldCheck, access: 'public' },
  ]

  const links = canManageMess(user) ? managerLinks : hasActiveMess(user) ? memberLinks : [{ href: '/profile', label: 'Profile', icon: User, access: 'public' as const }]
  return links.filter((item) => canAccessLevel(user, item.access))
}

export function canAccessAppPath(user: AuthUser | null | undefined, pathname: string) {
  const normalizedPathname = normalizePathname(pathname)

  if (normalizedPathname === '/' || normalizedPathname === '/more') return true

  const route = protectedRoutes.find((item) => {
    if (item.exact) return normalizedPathname === item.href
    return normalizedPathname === item.href || normalizedPathname.startsWith(`${item.href}/`)
  })

  return route ? canAccessLevel(user, route.access) : true
}

const appBackFallbacks: Array<{ href: string; fallback: string; exact?: boolean }> = [
  { href: '/more', fallback: '/', exact: true },
  { href: '/add-member', fallback: '/members', exact: true },
  { href: '/member-details', fallback: '/members', exact: true },
  { href: '/edit-member', fallback: '/members', exact: true },
  { href: '/add-expense', fallback: '/expenses', exact: true },
  { href: '/add-utility', fallback: '/expenses', exact: true },
  { href: '/expense-details', fallback: '/expenses', exact: true },
  { href: '/edit-expense', fallback: '/expenses', exact: true },
  { href: '/edit-deposit', fallback: '/deposits', exact: true },
  { href: '/meals/my', fallback: '/meals', exact: true },
  { href: '/meals/time', fallback: '/meals/manager', exact: true },
  { href: '/meals/members', fallback: '/meals/manager', exact: true },
  { href: '/meals/member-meal', fallback: '/meals/members', exact: true },
  { href: '/meals/manager', fallback: '/meals', exact: true },
  { href: '/meals/locks', fallback: '/meals/manager', exact: true },
  { href: '/meals/settings', fallback: '/meals/manager', exact: true },
  { href: '/meals/details', fallback: '/meals', exact: true },
  { href: '/add-meal', fallback: '/meals', exact: true },
  { href: '/edit-monthly-bill', fallback: '/monthly-bill', exact: true },
  { href: '/edit-payment', fallback: '/payments', exact: true },
  { href: '/edit-complaint', fallback: '/complaints', exact: true },
  { href: '/profile', fallback: '/more', exact: true },
  { href: '/settings', fallback: '/more', exact: true },
  { href: '/edit-profile', fallback: '/settings', exact: true },
  { href: '/change-password', fallback: '/settings', exact: true },
  { href: '/mess-management', fallback: '/more', exact: true },
  { href: '/create-mess', fallback: '/', exact: true },
  { href: '/request-mess', fallback: '/', exact: true },
]

export function getAppBackFallback(user: AuthUser | null | undefined, pathname: string) {
  const normalizedPathname = normalizePathname(pathname)
  const configuredFallback = appBackFallbacks.find((item) => {
    if (item.exact) return normalizedPathname === item.href
    return normalizedPathname === item.href || normalizedPathname.startsWith(`${item.href}/`)
  })

  if (configuredFallback) return configuredFallback.fallback
  if (normalizedPathname === '/') return '/'
  return getDefaultAppPath(user)
}

export function getDefaultAppPath(user: AuthUser | null | undefined) {
  if (canAccessAppPath(user, '/')) return '/'
  return getMoreLinks(user)[0]?.href ?? '/more'
}
