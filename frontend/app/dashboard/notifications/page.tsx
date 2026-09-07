'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { EnterpriseAsyncState, EnterpriseTableStateRow } from '@/components/ui/enterprise-async-state'
import { EnterpriseTableActionCell, EnterpriseTableActionHeader } from '@/components/ui/enterprise-table-actions'
import { useAuth } from '@/app/context/auth-context'
import { apiClient, type AppNotification } from '@/lib/api-client'
import { Bell, Trash2, CalendarDays } from 'lucide-react'
import { useEffect, useState } from 'react'
import { localizedNotificationCopy, useLocale, useLocaleFormatters, useTranslations } from '@/lib/i18n'

export default function NotificationsPage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const notificationsCopy = useTranslations('notifications')
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
        title={notificationsCopy('title')}
        description={notificationsCopy('description')}
      />

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-7 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl r bg-primary/10  ">
            <Bell size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{notificationsCopy('all')}</h2>
            <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
              {notificationsCopy('count', { count: format.number(notifications.length) })}
              {unreadCount > 0 && <span className="ml-2 text-primary">({notificationsCopy('unreadCount', { count: format.number(unreadCount) })})</span>}
            </p>
          </div>
        </div>

        {/* Notifications Table - Desktop */}
        <div className="dashboard-table-frame hidden sm:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{notificationsCopy('status')}</th>
                <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{notificationsCopy('titleColumn')}</th>
                <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{notificationsCopy('content')}</th>
                <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{notificationsCopy('date')}</th>
                <EnterpriseTableActionHeader size="compact" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <EnterpriseTableStateRow colSpan={5} status="loading" title={notificationsCopy('loading')} />
              ) : null}
              {!loading && notifications.length === 0 ? (
                <EnterpriseTableStateRow colSpan={5} status="empty" title={notificationsCopy('empty')} icon={Bell} />
              ) : null}
              {!loading && notifications.map((notification) => {
                const isRead = notification.reads?.some((read) => read.user_id === user?.id)
                const copy = localizedNotificationCopy(notification, locale)
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
                          {isRead ? notificationsCopy('read') : notificationsCopy('new')}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className={`text-sm font-bold ${isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {copy.title}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="max-w-md truncate text-sm font-semibold text-muted-foreground">
                        {copy.body}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <CalendarDays size={13} className="text-primary" />
                        {format.date(notification.created_at, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <EnterpriseTableActionCell size="compact">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            void deleteNotification(notification)
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 text-destructive transition hover:border-destructive/30 hover:bg-destructive/10"
                          title={notificationsCopy('delete')}
                          aria-label={notificationsCopy('delete')}
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
          {loading ? (
            <EnterpriseAsyncState status="loading" title={notificationsCopy('loading')} surface="plain" compact />
          ) : null}
          {!loading && notifications.length === 0 ? (
            <EnterpriseAsyncState status="empty" title={notificationsCopy('empty')} icon={Bell} surface="plain" compact />
          ) : null}
          {!loading && notifications.map((notification) => {
            const isRead = notification.reads?.some((read) => read.user_id === user?.id)
            const copy = localizedNotificationCopy(notification, locale)
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
                      {copy.title}
                    </h3>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      void deleteNotification(notification)
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 text-destructive transition hover:border-destructive/30 hover:bg-destructive/10"
                    title={notificationsCopy('delete')}
                    aria-label={notificationsCopy('delete')}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <p className="text-xs font-semibold text-muted-foreground leading-relaxed">{copy.body}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
                  <CalendarDays size={11} className="text-primary" />
                  {format.date(notification.created_at, { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
