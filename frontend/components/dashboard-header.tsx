'use client'

import { useAuth } from '@/app/context/auth-context'
import { Bell, CalendarDays, ChevronDown, Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { apiClient, type AppNotification } from '@/lib/api-client'

interface DashboardHeaderProps {
  title: string
  description?: string
  selectedMonth?: string
  onMonthChange?: (month: string) => void
}

function formatMonthLabel(month?: string) {
  const date = month ? new Date(`${month}-01T00:00:00`) : new Date()
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function getCurrentMonthValue() {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${date.getFullYear()}-${month}`
}

export function DashboardHeader({ title, description, selectedMonth, onMonthChange }: DashboardHeaderProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [imageError, setImageError] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const monthInputRef = useRef<HTMLInputElement>(null)

  const loadNotifications = async () => {
    try {
      const [notificationResponse, countResponse] = await Promise.all([
        apiClient.getMyNotifications({ limit: 5 }),
        apiClient.getUnreadNotificationCount(),
      ])
      setNotifications(Array.isArray(notificationResponse.data) ? notificationResponse.data : [])
      setUnreadCount(countResponse.data?.count ?? 0)
    } catch {
      setNotifications([])
      setUnreadCount(0)
    }
  }

  useEffect(() => {
    void loadNotifications()
    const handleFocus = () => void loadNotifications()
    const handleNotificationsChanged = () => void loadNotifications()
    window.addEventListener('focus', handleFocus)
    window.addEventListener('notifications:changed', handleNotificationsChanged)
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('notifications:changed', handleNotificationsChanged)
    }
  }, [])

  const markAsRead = async (notification: AppNotification) => {
    const alreadyRead = notification.reads?.some((read) => read.user_id === user?.id)
    if (!alreadyRead) {
      setUnreadCount((current) => Math.max(0, current - 1))
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                reads: [
                  ...(item.reads ?? []),
                  { user_id: user?.id ?? '', read_at: new Date().toISOString() },
                ],
              }
            : item,
        ),
      )
      await apiClient.markNotificationAsRead(notification.id).catch(() => {
        void loadNotifications()
      })
    }
  }

  const openMonthPicker = () => {
    const input = monthInputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null
    if (!input || !onMonthChange) return

    if (typeof input.showPicker === 'function') {
      input.showPicker()
      return
    }

    input.focus()
    input.click()
  }

  return (
    // <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-[#e6ebf4]">
    // ✅ Use this
    <header className="dashboard-header-clean sticky top-0 z-20">
      <div className="flex min-h-[72px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="pl-12 md:pl-0">
          <h1 className="text-2xl font-black tracking-tight text-[#07143d] sm:text-[28px]">{title}</h1>
          {description && <p className="mt-1 text-sm text-[#667085]">{description}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={openMonthPicker}
            className="relative hidden h-11 cursor-pointer items-center rounded-xl border border-[#e6ebf4] bg-white/60 px-4 text-sm font-bold text-[#53617d] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#EDF5FF] hover:shadow-md sm:flex"
          >
            <CalendarDays size={16} className="mr-2 text-[#667085]" />
            <span className="min-w-[120px]">{formatMonthLabel(selectedMonth)}</span>
            {onMonthChange && (
              <input
                ref={monthInputRef}
                type="month"
                value={selectedMonth ?? getCurrentMonthValue()}
                onChange={(event) => onMonthChange(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                className="absolute left-0 top-full h-0 w-0 opacity-0"
                aria-label="Select dashboard month"
              />
            )}
          </button>
          <button
            type="button"
            className="flex h-11 cursor-pointer items-center rounded-xl border border-[#e6ebf4] bg-white/60 px-4 text-sm font-bold text-[#53617d] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#EDF5FF] hover:shadow-md"
          >
            <Plus size={16} className="mr-2" />
            Quick Add
          </button>
          <DropdownMenu onOpenChange={(open) => open && void loadNotifications()}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-[#e6ebf4] bg-white/60 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#EDF5FF] hover:shadow-md data-[state=open]:bg-[#EDF5FF]"
              >
                <Bell size={18} className="text-[#667085]" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#ff2e55] px-1 text-[10px] font-black leading-none text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-2">
              <div className="flex items-center justify-between px-2 py-1">
                <DropdownMenuLabel className="p-0 text-sm font-black text-[#07143d]">
                  Notifications
                </DropdownMenuLabel>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/notifications')}
                  className="cursor-pointer rounded-md px-2 py-1 text-xs font-black text-[#2f80ed] transition hover:bg-[#EDF5FF]"
                >
                  View all
                </button>
              </div>
              <DropdownMenuSeparator />
              {notifications.length ? (
                notifications.map((notification) => {
                  const isRead = notification.reads?.some((read) => read.user_id === user?.id)
                  return (
                    <DropdownMenuItem
                      key={notification.id}
                      onClick={async () => {
                        await markAsRead(notification)
                        router.push('/dashboard/notifications')
                      }}
                      className="cursor-pointer items-start gap-3 rounded-lg p-3 transition hover:bg-[#EDF5FF] focus:bg-[#EDF5FF]"
                    >
                      <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${isRead ? 'bg-[#cbd5e1]' : 'bg-[#ff2e55]'}`} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black text-[#07143d]">
                          {notification.title}
                        </span>
                        <span className="mt-1 line-clamp-2 block text-xs font-semibold text-[#667085]">
                          {notification.body}
                        </span>
                      </span>
                    </DropdownMenuItem>
                  )
                })
              ) : (
                <div className="px-2 py-6 text-center text-sm font-semibold text-[#667085]">
                  No notifications yet.
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-11 cursor-pointer items-center rounded-xl border border-[#e6ebf4] bg-white/60 px-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#EDF5FF] hover:shadow-md data-[state=open]:bg-[#EDF5FF]"
              >
                {user?.avatar_url && !imageError ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="h-7 w-7 rounded-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#6f3df4] to-[#2f5bf6] text-xs font-black text-white">
                    {user?.name?.charAt(0).toUpperCase() || 'M'}
                  </span>
                )}
                <span className="hidden max-w-[120px] truncate px-2 text-sm font-bold text-[#07143d] sm:inline">{user?.name}</span>
                <ChevronDown size={15} className="text-[#667085]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-bold text-[#07143d]">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push('/dashboard/settings')}
                className="cursor-pointer transition"
              >
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer text-destructive transition"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
