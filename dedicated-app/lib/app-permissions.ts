'use client'

import type { ComponentType } from 'react'
import {
  Bell,
  BookOpenCheck,
  ClipboardList,
  ContactRound,
  Crown,
  DoorOpen,
  FileCheck2,
  House,
  Landmark,
  LayoutGrid,
  MessageSquareWarning,
  ReceiptText,
  Settings,
  ShieldCheck,
  ScrollText,
  User,
  Users,
  UtensilsCrossed,
  CalendarClock,
  Wallet2,
  CircleDollarSign,
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

export type MoreMenuItem = AppRouteItem & {
  description: string
}

export type MoreMenuGroup = {
  id: 'account' | 'workspace' | 'support'
  label: string
  items: MoreMenuItem[]
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
  { href: '/quick-add', label: 'Quick Add with AI', icon: Zap, access: 'mess', exact: true },
  { href: '/add-utility', label: 'Add Utility', icon: Zap, access: 'mess', exact: true },
  { href: '/expense-details', label: 'Expense Details', icon: ReceiptText, access: 'mess' },
  { href: '/edit-expense', label: 'Edit Expense', icon: ReceiptText, access: 'mess' },
  { href: '/deposits', label: 'Deposits', icon: Landmark, access: 'manager' },
  { href: '/edit-deposit', label: 'Edit Deposit', icon: Landmark, access: 'manager' },
  { href: '/notices', label: 'Notices', icon: Bell, access: 'mess' },
  { href: '/notifications', label: 'Notifications', icon: Bell, access: 'mess' },
  { href: '/meals/time', label: 'Set Meal Time', icon: UtensilsCrossed, access: 'manager' },
  { href: '/meals/members', label: 'Member Meals', icon: UtensilsCrossed, access: 'manager' },
  { href: '/meals/member-meal', label: 'Edit Member Meal', icon: UtensilsCrossed, access: 'manager' },
  { href: '/meals/manager', label: 'Manager Controls', icon: UtensilsCrossed, access: 'manager' },
  { href: '/meals/locks', label: 'Lock Meals', icon: UtensilsCrossed, access: 'manager' },
  { href: '/meals/settings', label: 'Meal Settings', icon: UtensilsCrossed, access: 'manager' },
  { href: '/meals/details', label: 'Meal Details', icon: UtensilsCrossed, access: 'mess' },
  { href: '/meals/my', label: 'My Meal', icon: UtensilsCrossed, access: 'mess' },
  { href: '/meals', label: 'Meals', icon: UtensilsCrossed, access: 'mess' },
  { href: '/meal-pattern', label: 'Meal Pattern', icon: CalendarClock, access: 'mess' },
  { href: '/add-meal', label: 'Add Meal', icon: UtensilsCrossed, access: 'mess', exact: true },
  { href: '/monthly-bill', label: 'Monthly Bill', icon: ClipboardList, access: 'mess' },
  { href: '/personal', label: 'Personal', icon: CircleDollarSign, access: 'public' },
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
  { href: '/subscription', label: 'Subscription', icon: Crown, access: 'mess', exact: true },
  { href: '/how-it-works', label: 'How It Works', icon: BookOpenCheck, access: 'public', exact: true },
  { href: '/contact-us', label: 'Contact Us', icon: ContactRound, access: 'public', exact: true },
  { href: '/privacy-policy', label: 'Privacy Policy', icon: ScrollText, access: 'public', exact: true },
  { href: '/terms-and-conditions', label: 'Terms & Conditions', icon: FileCheck2, access: 'public', exact: true },
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

  const primary: AppRouteItem = {
    href: '/personal',
    label: 'Personal',
    icon: CircleDollarSign,
    access: 'public',
  }

  const tabs: AppRouteItem[] = [
    { href: '/', label: 'Home', icon: House, access: 'public', exact: true },
    primary,
    { href: '/meal-pattern', label: 'Meal Pattern', icon: CalendarClock, access: 'mess' },
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
  return getMoreMenuGroups(user).flatMap((group) => group.items)
}

/**
 * The drawer is the secondary navigation surface. Home Quick actions are
 * removed by href so role-specific Quick changes never create duplicates.
 */
export function getMoreMenuGroups(user: AuthUser | null | undefined): MoreMenuGroup[] {
  const quickHrefs = new Set(getHomeQuickActions(user).map((item) => item.href))
  const groups: MoreMenuGroup[] = [
    {
      id: 'account',
      label: 'Account',
      items: [
        { href: '/profile', label: 'Profile', description: 'Personal details and account', icon: User, access: 'public' },
        { href: '/settings', label: 'Settings', description: 'Security and preferences', icon: ShieldCheck, access: 'public' },
      ],
    },
    {
      id: 'workspace',
      label: 'Workspace',
      items: [
        { href: '/meal-pattern', label: 'Meal Pattern', description: 'Review your meal calendar', icon: CalendarClock, access: 'mess' },
        { href: '/personal', label: 'Personal', description: 'Income, expenses, savings and family budgets', icon: CircleDollarSign, access: 'public' },
        { href: '/complaints', label: 'Complaints', description: 'Raise and follow up issues', icon: MessageSquareWarning, access: 'mess' },
        { href: '/mess-management', label: 'Mess Management', description: 'Rooms, rules and billing setup', icon: Settings, access: 'manager' },
        { href: '/subscription', label: 'Subscription', description: 'Current plan and available plans', icon: Crown, access: 'mess' },
      ],
    },
    {
      id: 'support',
      label: 'Help & legal',
      items: [
        { href: '/how-it-works', label: 'How It Works', description: 'A quick guide to Messzen', icon: BookOpenCheck, access: 'public' },
        { href: '/contact-us', label: 'Contact Us', description: 'Get help from our support team', icon: ContactRound, access: 'public' },
        { href: '/privacy-policy', label: 'Privacy Policy', description: 'How your information is handled', icon: ScrollText, access: 'public' },
        { href: '/terms-and-conditions', label: 'Terms & Conditions', description: 'Rules for using Messzen', icon: FileCheck2, access: 'public' },
      ],
    },
  ]

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessLevel(user, item.access) && !quickHrefs.has(item.href)),
    }))
    .filter((group) => group.items.length > 0)
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
  { href: '/quick-add', fallback: '/', exact: true },
  { href: '/add-utility', fallback: '/expenses', exact: true },
  { href: '/expense-details', fallback: '/expenses', exact: true },
  { href: '/edit-expense', fallback: '/expenses', exact: true },
  { href: '/edit-deposit', fallback: '/deposits', exact: true },
  { href: '/meals/my', fallback: '/meals', exact: true },
  { href: '/meal-pattern', fallback: '/', exact: true },
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
  { href: '/profile', fallback: '/', exact: true },
  { href: '/settings', fallback: '/', exact: true },
  { href: '/edit-profile', fallback: '/settings', exact: true },
  { href: '/change-password', fallback: '/settings', exact: true },
  { href: '/mess-management', fallback: '/', exact: true },
  { href: '/subscription', fallback: '/', exact: true },
  { href: '/personal', fallback: '/', exact: true },
  { href: '/how-it-works', fallback: '/', exact: true },
  { href: '/contact-us', fallback: '/', exact: true },
  { href: '/privacy-policy', fallback: '/', exact: true },
  { href: '/terms-and-conditions', fallback: '/', exact: true },
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
  return getMoreLinks(user)[0]?.href ?? '/profile'
}
