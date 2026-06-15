'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/app/context/auth-context'
import { apiClient, type AppNotification } from '@/lib/api-client'
import { Bell, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

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

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Notifications"
        description="Recent notices, complaints, requests and important updates"
      />

      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="app-card overflow-hidden p-0">
          <div className="border-b border-[#d8e6f8] px-5 py-4">
            <h2 className="text-base font-black text-[#172554]">All Notifications</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm font-semibold text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length ? (
            <div className="divide-y divide-[#d8e6f8]">
              {notifications.map((notification) => {
                const isRead = notification.reads?.some((read) => read.user_id === user?.id)
                return (
                  <div
                    key={notification.id}
                    onClick={() => void markAsRead(notification)}
                    className={`flex cursor-pointer flex-col gap-4 p-5 transition hover:bg-[#EDF5FF] sm:flex-row sm:items-start sm:justify-between ${isRead ? 'bg-white/50' : 'bg-[#edf5ff]/70'}`}
                  >
                    <div className="flex min-w-0 gap-4">
                      <span className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isRead ? 'bg-[#f1f5f9] text-[#64748b]' : 'bg-[#e7f1ff] text-[#2f80ed]'}`}>
                        <Bell size={18} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-black text-[#172554]">
                            {notification.title}
                          </h3>
                          {!isRead && (
                            <span className="rounded-full bg-[#ff2e55] px-2 py-0.5 text-[10px] font-black uppercase text-white">
                              New
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">
                          {notification.body}
                        </p>
                        <p className="mt-2 text-xs font-bold text-[#8a98b4]">
                          {notification.mess?.name ? `${notification.mess.name} - ` : ''}
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        void deleteNotification(notification)
                      }}
                      aria-label="Delete notification"
                      title="Delete"
                      className="h-10 w-10 shrink-0 rounded-lg border border-[#fecaca] bg-white p-0 text-[#dc2626] transition hover:bg-[#fff1f2]"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-sm font-semibold text-muted-foreground">
              No notifications yet.
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
