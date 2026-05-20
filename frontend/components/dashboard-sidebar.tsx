'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'
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
  Settings,
  ShoppingCart,
  UtensilsCrossed,
  Users,
  WalletCards,
  X,
} from 'lucide-react'
import { useState } from 'react'

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
  { label: 'Monthly Bills', href: '/dashboard/reports', icon: ClipboardList },
  { label: 'Payments', href: '/dashboard/payments', icon: CreditCard },
  { label: 'Notices', href: '/dashboard/notices', icon: Bell },
  { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { label: 'Settings', href: '/dashboard/mess_management', icon: Settings },
]

const adminItems = [
  ...commonItems,
  { label: 'Users', href: '/dashboard/users', icon: Users },
  { label: 'Mess Requests', href: '/dashboard/mess_requests', icon: ClipboardList },
  { label: 'All Messes', href: '/dashboard/mess_management', icon: Home },
  { label: 'Payments/Packages', href: '/dashboard/payments', icon: CreditCard },
  { label: 'Complaints', href: '/dashboard/complaints', icon: MessageSquareWarning },
  { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const sidebarItems =
    user?.role === 'ADMIN' ? adminItems : user?.role === 'MANAGER' || user?.role === 'ORGANIZER' ? managerItems : memberItems

  const content = (
    <aside className="flex h-full w-[248px] flex-col bg-gradient-to-b from-[#16106a] via-[#1e1776] to-[#17105e] text-white shadow-2xl">
      <div className="flex h-[76px] items-center px-7">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-sm font-black text-[#6539ef]">M</span>
          <span className="text-xl font-black">Mess.</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-2">
        <div className="space-y-1.5">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex h-11 items-center gap-3 rounded-lg px-4 text-sm font-bold transition ${
                  isActive
                    ? 'bg-gradient-to-r from-[#7442f4] to-[#5e38e8] text-white shadow-lg shadow-violet-950/20'
                    : 'text-white/82 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="border-t border-white/10 p-5">
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-white/5 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-black text-[#5636e9]">
            {user?.name?.charAt(0).toUpperCase() || 'M'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black">{user?.name || 'Mess User'}</p>
            <p className="truncate text-xs text-white/62">{user?.role || 'Member'}</p>
          </div>
        </div>
        <Button
          onClick={() => {
            logout()
            router.push('/login')
          }}
          className="h-10 w-full rounded-lg bg-white/10 text-white hover:bg-white/15"
        >
          <LogOut size={16} className="mr-2" />
          Logout
        </Button>
      </div>
    </aside>
  )

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white shadow md:hidden"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <div className="fixed left-0 top-0 z-30 hidden h-screen md:block">{content}</div>
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-black/45" onClick={() => setIsOpen(false)} aria-label="Close menu" />
          <div className="relative h-full w-[248px]">
            <button
              type="button"
              className="absolute left-[260px] top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0a1433]"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            {content}
          </div>
        </div>
      )}
    </>
  )
}
