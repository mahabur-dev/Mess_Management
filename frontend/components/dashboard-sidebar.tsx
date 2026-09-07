'use client'

import Link, { useLinkStatus } from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/app/context/auth-context'
import { BrandLogo } from '@/components/brand-logo'
import {
  LogOut,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react'

import { useSidebar } from '@/app/context/sidebar-context'
import { getDashboardNavigation } from '@/components/dashboard/dashboard-navigation'
import { roleLabel, useLocale, useTranslations } from '@/lib/i18n'

const sidebarIconButtonClass =
  'dashboard-icon-button flex h-9 w-9 items-center justify-center rounded-lg border-0 bg-transparent shadow-none'
const sidebarActiveLinkClass =
  'bg-transparent text-primary'
const sidebarInactiveLinkClass =
  'bg-transparent text-muted-foreground hover:text-primary'
const sidebarLogoutButtonClass =
  'border-destructive/30 bg-transparent text-destructive shadow-none hover:bg-destructive hover:text-primary-foreground'

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

interface SidebarLinkContentProps {
  icon: LucideIcon
  label: string
  isActive: boolean
  collapsed: boolean
}

function SidebarNavigationStatus({ label }: { label: string }) {
  const { pending } = useLinkStatus()
  const navigation = useTranslations('navigation')

  if (!pending) return null

  return (
    <>
      <span className="dashboard-loading-progress fixed inset-x-0 top-0 z-[120] h-1" aria-hidden="true" />
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {navigation('loadingPage', { page: label })}
      </span>
    </>
  )
}

function SidebarLinkContent({ icon: Icon, label, isActive, collapsed }: SidebarLinkContentProps) {
  return (
    <>
      <div className={`sidebar-nav-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-[background-color,color] duration-200 ease-out motion-reduce:transition-none ${
        isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
      }`}>
        <Icon
          size={18}
          aria-hidden="true"
          className={`block h-[18px] w-[18px] shrink-0 transition-colors duration-200 ease-out motion-reduce:transition-none ${
            isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
          }`}
        />
      </div>

      {!collapsed && <span className="truncate">{label}</span>}

      <SidebarNavigationStatus label={label} />
    </>
  )
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const { logout, user } = useAuth()
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar()
  const { locale } = useLocale()
  const navigation = useTranslations('navigation')
  const common = useTranslations('common')
  const activeUserMemberships = (user?.memberships ?? []).filter(
    // Login responses only contain active memberships and may omit this field.
    (membership) => membership.is_active !== false,
  )
  const hasAnyMess = activeUserMemberships.length > 0
  const managesMess = activeUserMemberships.some(
    (membership) => membership.role === 'MANAGER',
  )
  const sidebarItems = getDashboardNavigation({
    isAdmin: user?.role === 'ADMIN',
    canManage: user?.role === 'MANAGER' || managesMess,
    hasAnyMess,
  })

  const sidebarWidth = collapsed
    ? 'w-[var(--dashboard-sidebar-collapsed-width)]'
    : 'w-[var(--dashboard-sidebar-width)]'

  useEffect(() => {
    setPendingHref(null)
  }, [pathname])

  const content = (
    <aside className={`dashboard-sidebar flex h-full ${sidebarWidth} flex-col overflow-hidden transition-[width] duration-300`}>
      {/* Logo Area */}
      <div className="relative flex h-16 shrink-0 items-center border-b border-[var(--dashboard-line)] px-5">
        {collapsed ? (
          /* When collapsed: center the expand button (desktop only) */
          <div className="hidden lg:flex w-full items-center justify-center">
            <button
              onClick={() => setCollapsed(false)}
              className={sidebarIconButtonClass}
              title={navigation('expandSidebar')}
              aria-label={navigation('expandSidebar')}
            >
              <PanelLeftOpen size={18} aria-hidden="true" />
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
              title={navigation('collapseSidebar')}
              aria-label={navigation('collapseSidebar')}
            >
              <PanelLeftClose size={18} aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {/* Navigation with custom scrollbar */}
      <nav className="sidebar-nav flex-1 overflow-y-auto overflow-x-hidden px-3 py-5">
        <div className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const label = navigation(item.labelKey)
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const isVisuallyActive = pendingHref ? pendingHref === item.href : isActive
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                onClick={() => {
                  if (!isActive) setPendingHref(item.href)
                  setMobileOpen(false)
                }}
                aria-current={isActive ? 'page' : undefined}
                aria-busy={pendingHref === item.href || undefined}
                className={`group grid h-11 grid-cols-[36px_minmax(0,1fr)] items-center gap-3.5 rounded-md px-3.5 text-sm font-medium transition-colors duration-150 ${
                  isVisuallyActive ? sidebarActiveLinkClass : sidebarInactiveLinkClass
                } ${collapsed ? 'grid-cols-[36px] justify-center px-0' : ''}`}
                title={collapsed ? label : undefined}
              >
                <SidebarLinkContent
                  icon={Icon}
                  label={label}
                  isActive={isVisuallyActive}
                  collapsed={collapsed}
                />
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User Profile + Logout */}
      <div className="border-t border-[var(--dashboard-line)] p-4">
        <div className={`flex items-center gap-3 rounded-md p-2 ${collapsed ? 'justify-center px-2' : ''}`}>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-medium text-primary">
            {getInitials(user?.name || common('user'))}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{user?.name || common('messUser')}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.role ? roleLabel(user.role, locale) : roleLabel('MEMBER', locale)}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            logout()
            router.push('/login')
          }}
          className={`mt-2 flex h-10 w-full items-center justify-center gap-2.5 rounded-md border text-sm font-medium transition-colors ${sidebarLogoutButtonClass} ${collapsed ? 'px-0' : ''}`}
          title={collapsed ? navigation('logout') : undefined}
          aria-label={collapsed ? navigation('logout') : undefined}
        >
          <LogOut size={16} className="shrink-0" aria-hidden="true" />
          {!collapsed && <span>{navigation('logout')}</span>}
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
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-[var(--dashboard-sidebar-width)]">
            <button
              type="button"
              className="dashboard-icon-button absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-md"
              onClick={() => setMobileOpen(false)}
              aria-label={navigation('closeMenu')}
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
          scrollbar-gutter: stable;
        }
      `}</style>
    </>
  )
}
