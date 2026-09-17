'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, ChevronRight } from 'lucide-react'
import { LoadingIndicator } from '@/components/loading-indicator'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { api } from '@/lib/api'
import { localizedNotificationCopy, useLocale, useLocaleFormatters, useLocalizedNotice, useTranslations } from '@/lib/i18n'
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
  if (source === 'MEMBER_JOIN_APPROVED' || source === 'MEMBER_JOIN_REJECTED') return '/'
  if (source === 'EXPENSE' || source === 'EXPENSE_REVIEW') return '/expenses'
  if (source === 'PAYMENT' || source === 'PAYMENT_REVIEW') return '/payments'
  if (source === 'NOTICE') return '/notices'
  if (source === 'COMPLAINT') return '/complaints'
  if (item.metadata?.type === 'MEAL_WINDOW_OPENED' || item.metadata?.type === 'MEAL_DEADLINE_WARNING') return '/meals'
  if (item.metadata?.closeRequestId) return '/monthly-bill'
  return '/notifications'
}

export default function NotificationsPage() {
  const { locale } = useLocale()
  const t = useTranslations('communication')
  const format = useLocaleFormatters()
  const { notice, clearNotice, showError } = useLocalizedNotice('communication')
  const { refreshUnreadNotifications, user } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    if (!user?.id) {
      setItems([])
      setLoading(false)
      return
    }

    setLoading(true)
    clearNotice()
    api
      .getNotifications({ limit: 50, sortBy: 'created_at', sortOrder: 'desc' })
      .then((res) => setItems(Array.isArray(res.data) ? (res.data as NotificationItem[]) : []))
      .catch((requestError) => showError(requestError, 'loadNotificationsFailed'))
      .finally(() => setLoading(false))
  }, [clearNotice, showError, user?.id])

  useEffect(() => {
    load()
  }, [load])

  async function openNotification(item: NotificationItem) {
    const isRead = item.reads?.some((read) => read.user_id === user?.id)
    if (!isRead) {
      await api.markNotificationRead(item.id).catch(() => undefined)
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, reads: [...(entry.reads ?? []), { user_id: user?.id ?? '' }] } : entry))
      void refreshUnreadNotifications()
    }

    router.push(appHref(notificationRoute(item)))
  }

  return (
    <MobileShell>
      <TopScreen title={t('notifications')} subtitle={t('notificationSubtitle')} backHref="/" />
      <div className="screen space-y-4">
        {notice ? <div className={`ui-notice ui-notice--${notice.tone}`} role="alert">{notice.message}</div> : null}
        {loading ? <LoadingIndicator variant="card" label={t('loadingNotifications')} /> : null}
        {!loading && !items.length ? <div className="app-empty-state">{t('noNotifications')}</div> : null}
        <section className="app-section" aria-label={t('notificationList')}>
          <div className="app-list">
            {items.map((item) => {
              const isRead = item.reads?.some((read) => read.user_id === user?.id)
              const copy = localizedNotificationCopy(item, locale)
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
                      <span className="text-label font-semibold text-[#123748]">{copy.title}</span>
                      <ChevronRight size={17} className="mt-0.5 shrink-0 text-[#65838b]" aria-hidden="true" />
                    </span>
                    <span className="mt-1 block text-caption text-[#65838b]">{format.date(item.created_at, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="mt-2 block text-label text-[#65838b]">{copy.body}</span>
                    {!isRead ? <span className="mt-2 inline-flex items-center gap-1 text-caption font-semibold uppercase tracking-[0.1em] text-[#008d8c]"><Check size={13} aria-hidden="true" /> {t('new')}</span> : null}
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
