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
  { label: 'Monthly Bills', href: '/dashboard/monthly-bills', icon: ClipboardList },
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
    <aside className="dashboard-sidebar flex h-full w-[248px] flex-col overflow-hidden">
      <div className="flex h-[92px] items-center px-7">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2f80ed] text-sm font-black text-white shadow-[0_14px_28px_rgba(47,128,237,0.28)]">M</span>
          <span>
            <span className="block text-base font-black tracking-tight text-[#172554]">Mess.</span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#6b7a99]">Dashboard</span>
          </span>
        </Link>
      </div>

      <nav className="sidebar-scroll flex-1 overflow-y-auto px-4 py-2 pr-2">
        <div className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex h-12 items-center gap-3 rounded-xl px-4 text-sm font-bold transition ${
                  isActive
                    ? 'bg-[#2f80ed] text-white shadow-[0_15px_30px_rgba(47,128,237,0.28)]'
                    : 'text-[#53617d] hover:bg-[#edf5ff] hover:text-[#2f80ed]'
                }`}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="border-t border-[#d8e6f8] p-5">
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-[#edf5ff] p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-black text-[#2f80ed] shadow-sm">
            {user?.name?.charAt(0).toUpperCase() || 'M'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-[#172554]">{user?.name || 'Mess User'}</p>
            <p className="truncate text-xs font-semibold text-[#7a8aaa]">{user?.role || 'Member'}</p>
          </div>
        </div>
        <Button
          onClick={() => {
            logout()
            router.push('/login')
          }}
          className="h-11 w-full rounded-xl bg-[#2f80ed] text-white hover:bg-[#1f6fd6]"
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
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8e6f8] bg-white text-[#172554] shadow md:hidden"
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
              className="absolute left-[215px] top-0 flex h-8 w-8 items-center justify-center rounded-full text-white z-50 bg-[#2f80ed] shadow-[0_14px_28px_rgba(47,128,237,0.28)]"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <X size={20} className='text-white font-semibold'/>
            </button>
            {content}
          </div>
        </div>
      )}
    </>
  )
}
