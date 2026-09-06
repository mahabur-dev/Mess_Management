'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EnterpriseTableActionCell, EnterpriseTableActionHeader } from '@/components/ui/enterprise-table-actions'
import { useAuth } from '@/app/context/auth-context'
import { apiClient, type AppNotification } from '@/lib/api-client'
import { Bell, Trash2, Loader2, CalendarDays, Mail } from 'lucide-react'
import { useEffect, useState } from 'react'

const AVATAR_COLORS = ['var(--primary)']

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

const formatDate = (iso: string) => {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const response = await apiClient.getMyNotifications({ limit: 50 })
      setNotifications(Array.isArray(response.data) ? response.data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadNotifications()
  }, [])

  const deleteNotification = async (notification: AppNotification) => {
    setNotifications((current) => current.filter((item) => item.id !== notification.id))
    window.dispatchEvent(new Event('notifications:changed'))
    await apiClient.deleteNotification(notification.id).catch(() => {
      void loadNotifications()
      window.dispatchEvent(new Event('notifications:changed'))
    })
  }

  const markAsRead = async (notification: AppNotification) => {
    const alreadyRead = notification.reads?.some((read) => read.user_id === user?.id)
    if (alreadyRead) return

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
    window.dispatchEvent(new Event('notifications:changed'))

    await apiClient.markNotificationAsRead(notification.id).catch(() => {
      void loadNotifications()
      window.dispatchEvent(new Event('notifications:changed'))
    })
  }

  const unreadCount = notifications.filter(
    (n) => !n.reads?.some((r) => r.user_id === user?.id)
  ).length

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        title="Notifications"
        description="Recent notices, complaints, requests and important updates"
      />

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-7 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl r bg-primary/10  ">
            <Bell size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">All Notifications</h2>
            <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              {unreadCount > 0 && <span className="ml-2 text-primary">({unreadCount} unread)</span>}
            </p>
          </div>
        </div>

        {/* Notifications Table - Desktop */}
        <div className="dashboard-table-frame hidden sm:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Status</th>
                <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Title</th>
                <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Content</th>
                <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Date</th>
                <EnterpriseTableActionHeader size="compact" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground">
                      <Loader2 size={18} className="animate-spin text-primary" />
                      Loading notifications...
                    </div>
                  </td>
                </tr>
              )}
              {!loading && notifications.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Bell size={40} className="text-muted-foreground" />
                      <p className="text-sm font-bold text-muted-foreground">No notifications yet.</p>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && notifications.map((notification) => {
                const isRead = notification.reads?.some((read) => read.user_id === user?.id)
                return (
                  <tr
                    key={notification.id}
                    onClick={() => void markAsRead(notification)}
                    className={`transition hover:bg-muted cursor-pointer ${isRead ? '' : 'bg-primary/10'}`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {!isRead ? (
                          <span className="flex h-2 w-2 rounded-full bg-primary" />
                        ) : (
                          <span className="flex h-2 w-2 rounded-full bg-muted" />
                        )}
                        <span className={`text-[11px] font-bold ${isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {isRead ? 'Read' : 'New'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className={`text-sm font-bold ${isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {notification.title}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="max-w-md truncate text-sm font-semibold text-muted-foreground">
                        {notification.body}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <CalendarDays size={13} className="text-primary" />
                        {formatDate(notification.created_at)}
                      </span>
                    </td>
                    <EnterpriseTableActionCell size="compact">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            void deleteNotification(notification)
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 text-destructive transition hover:border-destructive/30 hover:bg-destructive/10"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                    </EnterpriseTableActionCell>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Notifications - Mobile Cards */}
        <div className="space-y-3 sm:hidden">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          )}
          {!loading && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Bell size={40} className="mb-2 text-muted-foreground" />
              <p className="text-sm font-bold text-muted-foreground">No notifications yet.</p>
            </div>
          )}
          {!loading && notifications.map((notification) => {
            const isRead = notification.reads?.some((read) => read.user_id === user?.id)
            return (
              <div
                key={notification.id}
                onClick={() => void markAsRead(notification)}
                className="rounded-xl border border-border bg-background p-4  transition hover:border-primary cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {!isRead && <span className="flex h-2.5 w-2.5 rounded-full bg-primary" />}
                    <h3 className={`text-sm font-bold ${isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {notification.title}
                    </h3>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      void deleteNotification(notification)
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 text-destructive transition hover:border-destructive/30 hover:bg-destructive/10"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <p className="text-xs font-semibold text-muted-foreground leading-relaxed">{notification.body}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
                  <CalendarDays size={11} className="text-primary" />
                  {formatDate(notification.created_at)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
