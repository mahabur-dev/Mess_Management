'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, ChevronRight } from 'lucide-react'
import { LoadingIndicator } from '@/components/loading-indicator'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { api } from '@/lib/api'
import { appHref } from '@/lib/routes'
import { useAuth } from '../providers'

type NotificationItem = {
  id: string
  type: string
  title: string
  body: string
  metadata?: Record<string, unknown> | null
  created_at: string
  reads?: Array<{ user_id: string; read_at?: string | null }>
}

function notificationRoute(item: NotificationItem) {
  const source = typeof item.metadata?.source === 'string' ? item.metadata.source : ''
  if (source === 'MEMBER_JOIN_REQUEST') return '/members'
  if (source === 'EXPENSE' || source === 'EXPENSE_REVIEW') return '/expenses'
  if (source === 'PAYMENT' || source === 'PAYMENT_REVIEW') return '/payments'
  if (source === 'NOTICE') return '/notices'
  return '/notifications'
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    if (!messId) {
      setItems([])
      setLoading(false)
      return
    }

    setLoading(true)
    api
      .getNotifications({ messId, limit: 50, sortBy: 'created_at', sortOrder: 'desc' })
      .then((res) => setItems(Array.isArray(res.data) ? (res.data as NotificationItem[]) : []))
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'Unable to load notifications.'))
      .finally(() => setLoading(false))
  }, [messId])

  useEffect(() => {
    load()
  }, [load])

  async function openNotification(item: NotificationItem) {
    const isRead = item.reads?.some((read) => read.user_id === user?.id)
    if (!isRead) {
      await api.markNotificationRead(item.id).catch(() => undefined)
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, reads: [...(entry.reads ?? []), { user_id: user?.id ?? '' }] } : entry))
    }

    router.push(appHref(notificationRoute(item)))
  }

  return (
    <MobileShell>
      <TopScreen title="Notifications" subtitle="Mess workspace updates" backHref="/" />
      <div className="screen space-y-4">
        {error ? <div className="ui-notice ui-notice--danger" role="alert">{error}</div> : null}
        {loading ? <LoadingIndicator variant="card" label="Loading notifications" /> : null}
        {!loading && !items.length ? <div className="app-empty-state">No notifications yet.</div> : null}
        <section className="app-section" aria-label="Notification list">
          <div className="app-list">
            {items.map((item) => {
              const isRead = item.reads?.some((read) => read.user_id === user?.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`app-list-row flex w-full items-start gap-3 text-left ${isRead ? '' : 'bg-[#f0fbfb]'}`}
                  onClick={() => void openNotification(item)}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#e4f7f6] text-[#008d8c]">
                    <Bell size={17} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span className="text-label font-bold text-[#123748]">{item.title}</span>
                      <ChevronRight size={17} className="mt-0.5 shrink-0 text-[#65838b]" aria-hidden="true" />
                    </span>
                    <span className="mt-1 block text-caption text-[#65838b]">{formatDate(item.created_at)}</span>
                    <span className="mt-2 block text-label text-[#65838b]">{item.body}</span>
                    {!isRead ? <span className="mt-2 inline-flex items-center gap-1 text-caption font-bold uppercase tracking-[0.1em] text-[#008d8c]"><Check size={13} aria-hidden="true" /> New</span> : null}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </MobileShell>
  )
}
