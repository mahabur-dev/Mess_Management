'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  UtensilsCrossed,
  TrendingUp,
  ShoppingCart,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'

const sidebarItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Meals', href: '/dashboard/meals', icon: UtensilsCrossed },
  { label: 'Finance', href: '/dashboard/finance', icon: TrendingUp },
  { label: 'Shopping', href: '/dashboard/shopping', icon: ShoppingCart },
  { label: 'Attendance', href: '/dashboard/attendance', icon: Calendar },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-40">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-card border border-border"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 z-30 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-sidebar-primary to-sidebar-accent">
              <span className="text-sidebar-primary-foreground font-bold text-lg">M</span>
            </div>
            <span className="font-bold text-lg text-sidebar-foreground hidden sm:inline">Mess</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-4 space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/20'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-sidebar-border space-y-4">
          <div className="px-4 py-3 bg-sidebar-accent/10 rounded-lg">
            <p className="text-xs text-sidebar-accent-foreground/70 mb-1">Logged in as</p>
            <p className="font-semibold text-sidebar-foreground text-sm truncate">{user?.name}</p>
            <p className="text-xs text-sidebar-accent-foreground/70">{user?.role}</p>
          </div>

          <Button
            onClick={handleLogout}
            className="w-full bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground flex items-center gap-2"
          >
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </aside>
    </>
  )
}
