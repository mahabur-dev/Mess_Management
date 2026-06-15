'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/app/context/auth-context'
import { apiClient, type AppNotification } from '@/lib/api-client'
import { Bell, CheckCircle2 } from 'lucide-react'
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

    await apiClient.markNotificationAsRead(notification.id).catch(() => {
      void loadNotifications()
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
                    className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between ${isRead ? 'bg-white/50' : 'bg-[#edf5ff]/70'}`}
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

                    {!isRead && (
                      <Button
                        type="button"
                        onClick={() => void markAsRead(notification)}
                        className="h-10 shrink-0 rounded-lg bg-[#2563EB] px-4 text-xs font-black text-white hover:bg-[#ffedfa]"
                      >
                        <CheckCircle2 size={15} className="mr-2" />
                        Mark Read
                      </Button>
                    )}
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
