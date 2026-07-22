'use client'

import type { ComponentType } from 'react'
import {
  Bell,
  ClipboardList,
  CreditCard,
  FileText,
  House,
  Landmark,
  MessageSquareWarning,
  ReceiptText,
  Settings,
  User,
  Users,
  UtensilsCrossed,
  Wallet2,
  Zap,
  type LucideProps,
} from 'lucide-react'
import type { AuthUser, MessMembership } from './auth'

export type AppIcon = ComponentType<LucideProps>
export type AccessLevel = 'public' | 'mess' | 'manager'

export type AppRouteItem = {
  href: string
  label: string
  icon: AppIcon
  access: AccessLevel
  exact?: boolean
}

const managerGlobalRoles = new Set(['ADMIN', 'MANAGER', 'ORGANIZER'])

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
  { href: '/members', label: 'Members', icon: Users, access: 'manager' },
  { href: '/add-member', label: 'Add Member', icon: Users, access: 'manager', exact: true },
  { href: '/edit-member', label: 'Edit Member', icon: Users, access: 'manager' },
  { href: '/expenses', label: 'Expenses', icon: ReceiptText, access: 'manager' },
  { href: '/add-expense', label: 'Add Expense', icon: ReceiptText, access: 'manager', exact: true },
  { href: '/add-utility', label: 'Add Utility', icon: Zap, access: 'manager', exact: true },
  { href: '/expense-details', label: 'Expense Details', icon: ReceiptText, access: 'manager' },
  { href: '/edit-expense', label: 'Edit Expense', icon: ReceiptText, access: 'manager' },
  { href: '/deposits', label: 'Deposits', icon: Landmark, access: 'manager' },
  { href: '/edit-deposit', label: 'Edit Deposit', icon: Landmark, access: 'manager' },
  { href: '/notices', label: 'Notices', icon: Bell, access: 'mess' },
  { href: '/meals', label: 'Meals', icon: UtensilsCrossed, access: 'mess' },
  { href: '/add-meal', label: 'Add Meal', icon: UtensilsCrossed, access: 'mess', exact: true },
  { href: '/monthly-bill', label: 'Monthly Bill', icon: ClipboardList, access: 'mess' },
  { href: '/edit-monthly-bill', label: 'Edit Bill', icon: ClipboardList, access: 'manager' },
  { href: '/payments', label: 'Payments', icon: CreditCard, access: 'mess' },
  { href: '/edit-payment', label: 'Edit Payment', icon: CreditCard, access: 'mess' },
  { href: '/complaints', label: 'Complaints', icon: MessageSquareWarning, access: 'mess' },
  { href: '/edit-complaint', label: 'Edit Complaint', icon: MessageSquareWarning, access: 'manager' },
  { href: '/profile', label: 'Profile', icon: User, access: 'public' },
  { href: '/settings', label: 'Settings', icon: Settings, access: 'public' },
]

export const managerQuickActions: AppRouteItem[] = [
  { href: '/add-member', label: 'Add Member', icon: Users, access: 'manager' },
  { href: '/add-expense', label: 'Add Expense', icon: Wallet2, access: 'manager' },
  { href: '/add-utility', label: 'Add Utility', icon: Zap, access: 'manager' },
  { href: '/add-meal', label: 'Add Meal', icon: UtensilsCrossed, access: 'mess' },
  { href: '/notices', label: 'Send Notice', icon: Bell, access: 'manager' },
  { href: '/monthly-bill', label: 'Monthly Bill', icon: ClipboardList, access: 'mess' },
]

export const memberQuickActions: AppRouteItem[] = [
  { href: '/add-meal', label: 'Add Meal', icon: UtensilsCrossed, access: 'mess' },
  { href: '/monthly-bill', label: 'My Bill', icon: ClipboardList, access: 'mess' },
  { href: '/payments', label: 'Payments', icon: CreditCard, access: 'mess' },
  { href: '/notices', label: 'Notices', icon: Bell, access: 'mess' },
  { href: '/complaints', label: 'Complaints', icon: MessageSquareWarning, access: 'mess' },
  { href: '/profile', label: 'Profile', icon: User, access: 'public' },
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
      { href: '/more', label: 'More', icon: FileText, access: 'public', exact: true },
    ]
    return onboardingTabs
  }

  const primary: AppRouteItem = canManageMess(user)
    ? { href: '/members', label: 'Members', icon: Users, access: 'manager' }
    : { href: '/monthly-bill', label: 'Bills', icon: ClipboardList, access: 'mess' }

  const tabs: AppRouteItem[] = [
    { href: '/', label: 'Home', icon: House, access: 'public', exact: true },
    primary,
    { href: '/meals', label: 'Meals', icon: UtensilsCrossed, access: 'mess' },
    { href: '/more', label: 'More', icon: FileText, access: 'public', exact: true },
  ]

  return tabs.filter((item) => canAccessLevel(user, item.access))
}

export function getMoreLinks(user: AuthUser | null | undefined): AppRouteItem[] {
  const managerLinks: AppRouteItem[] = [
    { href: '/members', label: 'Members', icon: Users, access: 'manager' },
    { href: '/meals', label: 'Meal Sheet', icon: UtensilsCrossed, access: 'mess' },
    { href: '/expenses', label: 'Bazar/Expenses', icon: ReceiptText, access: 'manager' },
    { href: '/deposits', label: 'Deposits', icon: Landmark, access: 'manager' },
    { href: '/monthly-bill', label: 'Monthly Bills', icon: ClipboardList, access: 'mess' },
    { href: '/payments', label: 'Payments', icon: CreditCard, access: 'mess' },
    { href: '/notices', label: 'Notices', icon: Bell, access: 'mess' },
    { href: '/complaints', label: 'Complaints', icon: MessageSquareWarning, access: 'mess' },
    { href: '/settings', label: 'Mess Management', icon: Settings, access: 'public' },
  ]

  const memberLinks: AppRouteItem[] = [
    { href: '/meals', label: 'My Meals', icon: UtensilsCrossed, access: 'mess' },
    { href: '/monthly-bill', label: 'Monthly Bills', icon: ClipboardList, access: 'mess' },
    { href: '/payments', label: 'Payments', icon: CreditCard, access: 'mess' },
    { href: '/notices', label: 'Notices', icon: Bell, access: 'mess' },
    { href: '/complaints', label: 'Complaints', icon: MessageSquareWarning, access: 'mess' },
    { href: '/profile', label: 'Profile', icon: User, access: 'public' },
    { href: '/settings', label: 'Settings', icon: Settings, access: 'public' },
  ]

  const links = canManageMess(user) ? managerLinks : hasActiveMess(user) ? memberLinks : [{ href: '/profile', label: 'Profile', icon: User, access: 'public' as const }]
  return links.filter((item) => canAccessLevel(user, item.access))
}

export function canAccessAppPath(user: AuthUser | null | undefined, pathname: string) {
  if (pathname === '/' || pathname === '/more') return true

  const route = protectedRoutes.find((item) => {
    if (item.exact) return pathname === item.href
    return pathname === item.href || pathname.startsWith(`${item.href}/`)
  })

  return route ? canAccessLevel(user, route.access) : true
}

export function getDefaultAppPath(user: AuthUser | null | undefined) {
  if (canAccessAppPath(user, '/')) return '/'
  return getMoreLinks(user)[0]?.href ?? '/more'
}
