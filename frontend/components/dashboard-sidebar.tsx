'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'
import { BrandLogo } from '@/components/brand-logo'
import { apiClient, type Mess } from '@/lib/api-client'
import { swrFetcher } from '@/lib/swr-fetcher'
import {
  BarChart3,
  Bell,
  CalendarClock,
  ClipboardList,
  CreditCard,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquareWarning,
  Mail,
  Settings,
  UtensilsCrossed,
  Users,
  WalletCards,
  X,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'

import { useSidebar } from '@/app/context/sidebar-context'

const commonItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
]

const onboardingItems = [
  ...commonItems,
  { label: 'Profile', href: '/dashboard/settings', icon: Settings },
]

const memberItems = [
  ...commonItems,
  { label: 'My Meals', href: '/dashboard/meals', icon: UtensilsCrossed },
  { label: 'Meal Pattern', href: '/dashboard/meal-patterns', icon: CalendarClock },
  { label: 'Monthly Bills', href: '/dashboard/monthly-bills', icon: ClipboardList },
  { label: 'My Bill', href: '/dashboard/finance', icon: WalletCards },
  { label: 'Deposits', href: '/dashboard/payments', icon: CreditCard },
  { label: 'Notices', href: '/dashboard/notices', icon: Bell },
  { label: 'Complaints', href: '/dashboard/complaints', icon: MessageSquareWarning },
  { label: 'Profile', href: '/dashboard/settings', icon: Settings },
]

const managerItems = [
  ...commonItems,
  { label: 'Members', href: '/dashboard/member_management', icon: Users },
  { label: 'Meal Sheet', href: '/dashboard/meals', icon: UtensilsCrossed },
  { label: 'Meal Patterns', href: '/dashboard/meal-patterns', icon: CalendarClock },
  { label: 'Bazar/Expenses', href: '/dashboard/finance', icon: WalletCards },
  { label: 'Monthly Bills', href: '/dashboard/monthly-bills', icon: ClipboardList },
  { label: 'Deposits', href: '/dashboard/payments', icon: CreditCard },
  { label: 'Notices', href: '/dashboard/notices', icon: Bell },
  { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { label: 'Mess Management', href: '/dashboard/mess_management', icon: Settings },
]

const adminItems = [
  ...commonItems,
  { label: 'Users', href: '/dashboard/users', icon: Users },
  { label: 'Mess Requests', href: '/dashboard/mess_requests', icon: ClipboardList },
  { label: 'Contact Requests', href: '/dashboard/contact-requests', icon: Mail },
  { label: 'All Messes', href: '/dashboard/mess_management', icon: Home },
  // { label: 'Payments/Packages', href: '/dashboard/payments', icon: CreditCard },
  { label: 'Subscriptions', href: '/dashboard/subscriptions', icon: BarChart3 },
  { label: 'Complaints', href: '/dashboard/complaints', icon: MessageSquareWarning },
  { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#10b981', '#3b82f6', '#f43f5e']
const sidebarIconButtonClass =
  'dashboard-icon-button flex h-9 w-9 items-center justify-center rounded-lg border-0 bg-transparent shadow-none'
const sidebarActiveLinkClass =
  'bg-gradient-to-r from-[var(--brand-dark)] to-[var(--brand)] text-white shadow-[0_8px_20px_var(--brand-shadow)]'
const sidebarInactiveLinkClass =
  'text-muted-foreground hover:bg-[var(--dashboard-hover)] hover:text-[var(--brand)]'
const sidebarLogoutButtonClass =
  'border-red-200 bg-red-50 text-red-600 shadow-[0_8px_18px_rgba(220,38,38,0.08)] hover:border-red-300 hover:bg-red-600 hover:text-white'

const avatarColor = (name: string) => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user } = useAuth()
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar()
  const { data: sidebarMessesData } = useSWR(
    user && user.role !== 'ADMIN' ? 'messes' : null,
    () => swrFetcher(() => apiClient.getMesses()),
    { revalidateOnFocus: true, dedupingInterval: 15_000 },
  )

  const sidebarMesses = Array.isArray(sidebarMessesData)
    ? sidebarMessesData
    : sidebarMessesData
      ? [sidebarMessesData as Mess]
      : []
  const userMemberships = user?.memberships ?? []
  const hasAnyMess = sidebarMesses.length > 0 || userMemberships.length > 0
  const managesMess = sidebarMesses.some((mess) => (
    mess.created_by === user?.id ||
    mess.memberships?.some((membership) => membership.user_id === user?.id && membership.role === 'MANAGER' && membership.is_active)
  ))
  const sidebarItems =
    user?.role === 'ADMIN'
      ? adminItems
      : user?.role === 'MANAGER' || managesMess
        ? managerItems
        : hasAnyMess
          ? memberItems
          : onboardingItems

  const avatarBg = avatarColor(user?.name || 'User')
  const sidebarWidth = collapsed ? 'w-[72px]' : 'w-[280px]'

  const content = (
    <aside className={`dashboard-sidebar flex h-full ${sidebarWidth} flex-col overflow-hidden transition-all duration-300`}>
      {/* Logo Area */}
      <div className="relative flex h-[72px] items-center border-b border-[var(--dashboard-line)] px-5">
        {collapsed ? (
          /* When collapsed: center the expand button (desktop only) */
          <div className="hidden lg:flex w-full items-center justify-center">
            <button
              onClick={() => setCollapsed(false)}
              className={sidebarIconButtonClass}
              title="Expand sidebar"
            >
              <PanelLeftOpen size={18} />
            </button>
          </div>
        ) : (
          /* When expanded: logo on left, collapse button on right (desktop only) */
          <>
            <Link href="/dashboard" className="flex items-center">
              <BrandLogo />
            </Link>
            <button
              onClick={() => setCollapsed(true)}
              className={`ml-auto hidden lg:flex ${sidebarIconButtonClass}`}
              title="Collapse sidebar"
            >
              <PanelLeftClose size={18} />
            </button>
          </>
        )}
      </div>

      {/* Navigation with custom scrollbar */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-5 sidebar-nav">
        <div className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group flex h-[50px] items-center gap-3.5 rounded-xl px-3.5 text-sm font-bold transition-all ${
                  isActive ? sidebarActiveLinkClass : sidebarInactiveLinkClass
                } ${collapsed ? 'justify-center px-0' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all ${
                  isActive ? 'bg-white/20' : 'bg-[var(--dashboard-surface-subtle)] group-hover:bg-[var(--brand-soft)]'
                }`}>
                  <Icon size={18} />
                </div>
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {isActive && <ChevronRight size={15} className="text-white/60 shrink-0" />}
                  </>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User Profile + Logout */}
      <div className="border-t border-[var(--dashboard-line)] p-4">
        <div className={`dashboard-subtle-card flex items-center gap-3 rounded-xl p-3 ${collapsed ? 'justify-center px-2' : ''}`}>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-black shadow-sm"
            style={{
              backgroundColor: `${avatarBg}18`,
              borderColor: `${avatarBg}55`,
              color: avatarBg,
            }}
          >
            {getInitials(user?.name || 'User')}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">{user?.name || 'Mess User'}</p>
              <p className="truncate text-xs font-semibold text-muted-foreground">{user?.role || 'Member'}</p>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            logout()
            router.push('/login')
          }}
          className={`mt-3 flex h-[46px] w-full items-center justify-center gap-2.5 rounded-xl border text-sm font-bold transition ${sidebarLogoutButtonClass} ${collapsed ? 'px-0' : ''}`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>

      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop Sidebar - only visible on desktop and above */}
      <div className="fixed left-0 top-0 z-30 hidden h-screen lg:block">{content}</div>

      {/* Overlay - visible on mobile and tablet (hidden on desktop) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-[#120a33]/65 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-[280px] shadow-[0_28px_80px_rgba(18,10,51,0.35)]">
            <button
              type="button"
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-[var(--brand-dark)] to-[var(--brand)] text-white shadow-[0_8px_20px_var(--brand-shadow)]"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
            {content}
          </div>
        </div>
      )}

      <style jsx global>{`
        /* Custom scrollbar for sidebar */
        .sidebar-nav::-webkit-scrollbar {
          width: 6px;
        }
        .sidebar-nav::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-nav::-webkit-scrollbar-thumb {
          background: var(--brand-border-subtle);
          border-radius: 3px;
          transition: background 0.2s;
        }
        .sidebar-nav::-webkit-scrollbar-thumb:hover {
          background: var(--brand-border);
        }
        /* Firefox */
        .sidebar-nav {
          scrollbar-width: thin;
          scrollbar-color: var(--brand-border-subtle) transparent;
        }
      `}</style>
    </>
  )
}
