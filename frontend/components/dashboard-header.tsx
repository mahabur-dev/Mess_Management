'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  ChevronDown,
  CreditCard,
  LogOut,
  Mail,
  Menu,
  Plus,
  Settings,
  ShoppingBag,
} from 'lucide-react'

import { useAuth } from '@/app/context/auth-context'
import { useSidebar } from '@/app/context/sidebar-context'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitcher } from '@/components/language-switcher'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { EnterpriseMonthPicker } from '@/components/ui/enterprise-date-picker'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { apiClient, type AppNotification } from '@/lib/api-client'
import { localizedNotificationCopy, useLocale, useLocaleFormatters, useTranslations } from '@/lib/i18n'

interface DashboardHeaderProps {
  title: string
  description?: string
  selectedMonth?: string
  onMonthChange?: (month: string) => void
  showQuickAddButton?: boolean
  showUpgradeButton?: boolean
  upgradeHref?: string
}

function getCurrentMonthValue() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function DashboardHeader({
  title,
  description,
  selectedMonth,
  onMonthChange,
  showQuickAddButton = true,
  showUpgradeButton,
  upgradeHref = '/dashboard/contact?source=UPGRADE&plan=MONTHLY',
}: DashboardHeaderProps) {
  const { user, logout } = useAuth()
  const { setMobileOpen } = useSidebar()
  const router = useRouter()
  const { locale } = useLocale()
  const notificationsCopy = useTranslations('notifications')
  const navigation = useTranslations('navigation')
  const common = useTranslations('common')
  const format = useLocaleFormatters()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

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
    const refresh = () => void loadNotifications()
    window.addEventListener('focus', refresh)
    window.addEventListener('notifications:changed', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      window.removeEventListener('notifications:changed', refresh)
    }
  }, [])

  const markAsRead = async (notification: AppNotification) => {
    if (notification.reads?.some((read) => read.user_id === user?.id)) return

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

  return (
    <header className="dashboard-header-clean sticky top-0 z-20 h-16 w-full min-w-0 shrink-0">
      <div className="flex h-full min-w-0 items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label={navigation('openMenu')}
          >
            <Menu />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">{title}</h1>
            {description ? (
              <p className="truncate text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
          {onMonthChange ? (
            <EnterpriseMonthPicker
              value={selectedMonth ?? getCurrentMonthValue()}
              onValueChange={onMonthChange}
              className="hidden w-44 sm:inline-flex"
              ariaLabel={navigation('selectDashboardMonth')}
            />
          ) : null}

          {showQuickAddButton && user?.role !== 'ADMIN' ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="hidden sm:inline-flex">
                  <Plus />
                  {navigation('quickAdd')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="dashboard-popover w-56">
                <DropdownMenuItem onClick={() => router.push('/dashboard/finance')}>
                  <ShoppingBag className="text-primary" />
                  <div>
                    <p className="font-medium">{navigation('addExpense')}</p>
                    <p className="text-xs text-muted-foreground">{navigation('recordNewExpense')}</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/dashboard/payments')}>
                  <CreditCard className="text-primary" />
                  <div>
                    <p className="font-medium">{navigation('addDeposit')}</p>
                    <p className="text-xs text-muted-foreground">{navigation('recordNewDeposit')}</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          {showUpgradeButton ? (
            <Button onClick={() => router.push(upgradeHref)} className="hidden sm:inline-flex">
              <Mail />
              {navigation('upgrade')}
            </Button>
          ) : null}

          <LanguageSwitcher compact />
          <ThemeToggle />

          <DropdownMenu onOpenChange={(open) => open && void loadNotifications()}>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="relative">
                <Bell />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] leading-none text-white">
                    {unreadCount > 99 ? `${format.number(99)}+` : format.number(unreadCount)}
                  </span>
                ) : null}
                <span className="sr-only">{notificationsCopy('title')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="dashboard-popover w-80">
              <div className="flex items-center justify-between px-2 py-1.5">
                <DropdownMenuLabel className="p-0">{notificationsCopy('title')}</DropdownMenuLabel>
                <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/notifications')}>
                  {notificationsCopy('viewAll')}
                </Button>
              </div>
              <DropdownMenuSeparator />
              {notifications.length ? (
                notifications.map((notification) => {
                  const isRead = notification.reads?.some((read) => read.user_id === user?.id)
                  const copy = localizedNotificationCopy(notification, locale)
                  return (
                    <DropdownMenuItem
                      key={notification.id}
                      onClick={async () => {
                        await markAsRead(notification)
                        router.push('/dashboard/notifications')
                      }}
                      className="items-start gap-3 py-3"
                    >
                      <span
                        className={
                          isRead
                            ? 'mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground/30'
                            : 'mt-1.5 size-2 shrink-0 rounded-full bg-primary'
                        }
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{copy.title}</span>
                        <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                          {copy.body}
                        </span>
                      </span>
                    </DropdownMenuItem>
                  )
                })
              ) : (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  {notificationsCopy('empty')}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <Avatar className="size-7">
                  <AvatarImage src={user?.avatar_url || undefined} alt={user?.name || common('user')} />
                  <AvatarFallback className="bg-primary/10 text-xs text-primary">
                    {getInitials(user?.name || common('user'))}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-28 truncate sm:inline">{user?.name}</span>
                <ChevronDown className="text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="dashboard-popover w-60">
              <DropdownMenuLabel>
                <span className="block truncate font-medium">{user?.name}</span>
                <span className="block truncate text-xs font-normal text-muted-foreground">{user?.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                <Settings className="text-primary" />
                {navigation('profileSettings')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  logout()
                  router.push('/login')
                }}
              >
                <LogOut />
                {navigation('logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
