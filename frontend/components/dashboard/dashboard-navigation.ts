import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Bell,
  Building2,
  CalendarClock,
  CalendarRange,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Mail,
  MessageSquareWarning,
  Settings,
  Sparkles,
  UtensilsCrossed,
  Users,
  WalletCards,
} from 'lucide-react'

import { APP_FEATURES } from '@/lib/feature-flags'
import type { MessageKey } from '@/lib/i18n'

export interface DashboardNavigationItem {
  href: string
  icon: LucideIcon
  labelKey: MessageKey<'navigation'>
}

const overview: DashboardNavigationItem = {
  labelKey: 'dashboard',
  href: '/dashboard',
  icon: LayoutDashboard,
}

const onboardingItems: DashboardNavigationItem[] = [
  overview,
  { labelKey: 'profile', href: '/dashboard/settings', icon: Settings },
]

const memberItems: DashboardNavigationItem[] = [
  overview,
  { labelKey: 'quickAddAi', href: '/dashboard/quick-add', icon: Sparkles },
  { labelKey: 'myMeals', href: '/dashboard/meals', icon: UtensilsCrossed },
  { labelKey: 'mealPattern', href: '/dashboard/meal-patterns', icon: CalendarClock },
  { labelKey: 'bazarSchedule', href: '/dashboard/bazar-schedule', icon: CalendarRange },
  { labelKey: 'monthlyBills', href: '/dashboard/monthly-bills', icon: ClipboardList },
  { labelKey: 'myBill', href: '/dashboard/finance', icon: WalletCards },
  { labelKey: 'deposits', href: '/dashboard/payments', icon: CreditCard },
  { labelKey: 'notices', href: '/dashboard/notices', icon: Bell },
  { labelKey: 'complaints', href: '/dashboard/complaints', icon: MessageSquareWarning },
  { labelKey: 'profile', href: '/dashboard/settings', icon: Settings },
]

const managerItems: DashboardNavigationItem[] = [
  overview,
  { labelKey: 'quickAddAi', href: '/dashboard/quick-add', icon: Sparkles },
  { labelKey: 'members', href: '/dashboard/member_management', icon: Users },
  { labelKey: 'mealSheet', href: '/dashboard/meals', icon: UtensilsCrossed },
  { labelKey: 'mealPatterns', href: '/dashboard/meal-patterns', icon: CalendarClock },
  { labelKey: 'bazarSchedule', href: '/dashboard/bazar-schedule', icon: CalendarRange },
  { labelKey: 'bazarExpenses', href: '/dashboard/finance', icon: WalletCards },
  { labelKey: 'monthlyBills', href: '/dashboard/monthly-bills', icon: ClipboardList },
  { labelKey: 'deposits', href: '/dashboard/payments', icon: CreditCard },
  { labelKey: 'notices', href: '/dashboard/notices', icon: Bell },
  { labelKey: 'reports', href: '/dashboard/reports', icon: BarChart3 },
  { labelKey: 'messManagement', href: '/dashboard/mess_management', icon: Settings },
]

const adminItems: DashboardNavigationItem[] = [
  overview,
  { labelKey: 'users', href: '/dashboard/users', icon: Users },
  { labelKey: 'contactRequests', href: '/dashboard/contact-requests', icon: Mail },
  { labelKey: 'allMesses', href: '/dashboard/all-messes', icon: Building2 },
  ...(APP_FEATURES.subscriptions
    ? [{ labelKey: 'subscriptions' as const, href: '/dashboard/subscriptions', icon: BarChart3 }]
    : []),
  { labelKey: 'complaints', href: '/dashboard/complaints', icon: MessageSquareWarning },
  { labelKey: 'settings', href: '/dashboard/settings', icon: Settings },
]

interface NavigationContext {
  isAdmin: boolean
  canManage: boolean
  hasAnyMess: boolean
}

export function getDashboardNavigation({
  isAdmin,
  canManage,
  hasAnyMess,
}: NavigationContext): DashboardNavigationItem[] {
  if (isAdmin) return adminItems
  if (canManage) return managerItems
  if (hasAnyMess) return memberItems
  return onboardingItems
}
