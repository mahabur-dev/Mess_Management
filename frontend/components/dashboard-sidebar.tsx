'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'
import { BrandLogo } from '@/components/brand-logo'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  Bell,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareWarning,
  Mail,
  Settings,
  ShoppingCart,
  UtensilsCrossed,
  Users,
  WalletCards,
  X,
  ChevronRight,
  ChevronLeft,
  PanelLeft,
} from 'lucide-react'
import { useState } from 'react'
import { useSidebar } from '@/app/context/sidebar-context'

const commonItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
]

const memberItems = [
  ...commonItems,
  { label: 'My Meals', href: '/dashboard/meals', icon: UtensilsCrossed },
  { label: 'My Bill', href: '/dashboard/finance', icon: WalletCards },
  { label: 'Payment', href: '/dashboard/payments', icon: CreditCard },
  { label: 'Notices', href: '/dashboard/notices', icon: Bell },
  { label: 'Complaints', href: '/dashboard/complaints', icon: MessageSquareWarning },
  { label: 'Profile', href: '/dashboard/settings', icon: Settings },
]

const managerItems = [
  ...commonItems,
  { label: 'Members', href: '/dashboard/member_management', icon: Users },
  { label: 'Meal Sheet', href: '/dashboard/meals', icon: UtensilsCrossed },
  { label: 'Bazar/Expenses', href: '/dashboard/finance', icon: WalletCards },
  { label: 'Monthly Bills', href: '/dashboard/monthly-bills', icon: ClipboardList },
  { label: 'Payments', href: '/dashboard/payments', icon: CreditCard },
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
  const [isOpen, setIsOpen] = useState(false)
  const { collapsed, setCollapsed } = useSidebar()
  const sidebarItems =
    user?.role === 'ADMIN' ? adminItems : user?.role === 'MANAGER' || user?.role === 'ORGANIZER' ? managerItems : memberItems

  const avatarBg = avatarColor(user?.name || 'User')
  const sidebarWidth = collapsed ? 'w-[72px]' : 'w-[280px]'

  const content = (
    <aside className={`flex h-full ${sidebarWidth} flex-col overflow-hidden border-r border-[#e6ebf4] bg-white transition-all duration-300`}>
      {/* Logo Area */}
      <div className="relative flex h-[88px] items-center border-b border-[#e6ebf4] px-5">
        <Link href="/dashboard" className="flex items-center gap-3.5">
          {/* <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2f80ed] to-[#3b8cff] text-base font-black text-white shadow-[0_4px_12px_rgba(47,128,237,0.3)]">
            M
          </div> */}
          <BrandLogo  />
          {/* {!collapsed && (
            <div className="min-w-0">
              <p className="text-base font-black text-[#172554] tracking-tight leading-none">Mess</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6b7a99]">Dashboard</p>
            </div>
          )} */}
        </Link>
        
        {/* Collapse button - top right */}
        {/* <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-[#8a9bb5] transition hover:bg-[#f8faff] hover:text-[#2f80ed]"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <PanelLeft size={16} />
        </button> */}
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
                onClick={() => setIsOpen(false)}
                className={`group flex h-[50px] items-center gap-3.5 rounded-xl px-3.5 text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] text-white shadow-[0_8px_20px_rgba(47,128,237,0.25)]'
                    : 'text-[#53617d] hover:bg-[#f0f4fe] hover:text-[#2f80ed]'
                } ${collapsed ? 'justify-center px-0' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all ${
                  isActive ? 'bg-white/20' : 'bg-[#f1f5f9] group-hover:bg-[#e7f1ff]'
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
      <div className="border-t border-[#e6ebf4] p-4">
        <div className={`flex items-center gap-3 rounded-xl bg-[#f8faff] p-3 ${collapsed ? 'justify-center px-2' : ''}`}>
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
              <p className="truncate text-sm font-bold text-[#172554]">{user?.name || 'Mess User'}</p>
              <p className="truncate text-xs font-semibold text-[#7a8aaa]">{user?.role || 'Member'}</p>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            logout()
            router.push('/login')
          }}
          className={`mt-3 flex h-[46px] w-full items-center justify-center gap-2.5 rounded-xl border border-[#e6ebf4] bg-white text-sm font-bold text-[#53617d] transition hover:border-[#ff4d4f]/30 hover:bg-red-50 hover:text-[#ff4d4f] ${collapsed ? 'px-0' : ''}`}
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
      {/* Hamburger - visible on mobile & tablet */}
      <button
        type="button"
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-[#e6ebf4] bg-white text-[#172554] shadow-sm lg:hidden"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Desktop Sidebar - only visible on large screens and above */}
      <div className="fixed left-0 top-0 z-30 hidden h-screen lg:block">{content}</div>

      {/* Overlay - visible on mobile & tablet (below lg) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-[#120a33]/65 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative h-full w-[280px] shadow-[0_28px_80px_rgba(18,10,51,0.35)]">
            <button
              type="button"
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] text-white shadow-[0_8px_20px_rgba(47,128,237,0.3)]"
              onClick={() => setIsOpen(false)}
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
          background: #d8e6f8;
          border-radius: 3px;
          transition: background 0.2s;
        }
        .sidebar-nav::-webkit-scrollbar-thumb:hover {
          background: #a9ccfb;
        }
        /* Firefox */
        .sidebar-nav {
          scrollbar-width: thin;
          scrollbar-color: #d8e6f8 transparent;
        }
      `}</style>
    </>
  )
}
