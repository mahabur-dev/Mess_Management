'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { EnterpriseButton } from '@/components/ui/enterprise-button'
import { EnterpriseDetailsDrawer } from '@/components/ui/enterprise-details-drawer'
import { EnterpriseDrawerAction, EnterpriseDrawerFooter } from '@/components/ui/enterprise-drawer-footer'
import { EnterpriseSelect } from '@/components/ui/enterprise-select'
import { apiClient, type Mess, type Notice, type NoticeType } from '@/lib/api-client'
import { useAuth } from '@/app/context/auth-context'
import { Bell, Pin, Plus, X, Loader2, Megaphone, CalendarDays, AlertCircle, MessageCircle, FileText, Home } from 'lucide-react'
import { useEffect, useState } from 'react'
import { noticeTypeLabel, useLocale, useLocaleFormatters, useTranslations } from '@/lib/i18n'

const noticeTypes: NoticeType[] = ['MEAL', 'PAYMENT', 'EMERGENCY', 'MEETING', 'RULE_UPDATE', 'GENERAL']

const NOTICE_CONFIG: Record<NoticeType, { icon: React.ReactNode; color: string; bg: string }> = {
  MEAL: { icon: <Bell size={14} />, color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
  PAYMENT: { icon: <Bell size={14} />, color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
  EMERGENCY: { icon: <AlertCircle size={14} />, color: 'var(--destructive)', bg: 'color-mix(in srgb, var(--destructive) 10%, transparent)' },
  MEETING: { icon: <MessageCircle size={14} />, color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
  RULE_UPDATE: { icon: <FileText size={14} />, color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
  GENERAL: { icon: <Megaphone size={14} />, color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
}

export default function NoticesPage() {
  const [messes, setMesses] = useState<Mess[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState<NoticeType>('GENERAL')
  const { user } = useAuth()
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const t = useTranslations('noticesPage')
  const activeMess = messes[0] ?? user?.memberships?.[0]?.mess
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const [showModal, setShowModal] = useState(false)
  const [publishing, setPublishing] = useState(false)

  async function load() {
    const messRes = await apiClient.getMesses().catch(() => null)
    const list = Array.isArray(messRes?.data)
      ? messRes.data
      : messRes?.data
        ? [messRes.data]
        : ((user?.memberships?.map((item) => item.mess).filter(Boolean) ?? []) as Mess[])
    setMesses(list)
    if (list[0]) {
      const noticeRes = await apiClient.getNoticesByMess(list[0].id).catch(() => null)
      setNotices(Array.isArray(noticeRes?.data) ? noticeRes.data : [])
    }
  }

  useEffect(() => {
    load()
  }, [user?.role])

  async function publish() {
    if (!activeMess || !title.trim() || !body.trim()) return
    setPublishing(true)
    try {
      await apiClient.createNotice({ messId: activeMess.id, title, body, type })
      setTitle('')
      setBody('')
      setShowModal(false)
      await load()
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title={t('title')} description={t('description')} />

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl r bg-primary/10  ">
              <Megaphone size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t('allNotices')}</h2>
              <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                {t('postedCount', { count: format.number(notices.length) })}
              </p>
            </div>
          </div>
          {isManager && (
            <EnterpriseButton onClick={() => setShowModal(true)} className="gap-2">
              <Plus size={18} />
              {t('createNotice')}
            </EnterpriseButton>
          )}
        </div>

        {/* Notices Table - Desktop */}
        <div className="dashboard-table-frame hidden sm:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{t('type')}</th>
                <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{t('noticeTitle')}</th>
                <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{t('content')}</th>
                <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{t('date')}</th>
                <th className="whitespace-nowrap px-5 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{t('status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {notices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Megaphone size={40} className="text-muted-foreground" />
                      <p className="text-sm font-bold text-muted-foreground">{t('empty')}</p>
                    </div>
                  </td>
                </tr>
              )}
              {notices.map((notice) => {
                const cfg = NOTICE_CONFIG[notice.type as NoticeType] || NOTICE_CONFIG.GENERAL
                return (
                  <tr key={notice.id} className="transition hover:bg-muted group">
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold"
                        style={{ backgroundColor: cfg.bg, color: cfg.color, borderColor: 'var(--border)' }}
                      >
                        {cfg.icon}
                        {noticeTypeLabel(notice.type, locale)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground">{notice.title}</p>
                        {notice.is_pinned && <Pin size={14} className="shrink-0 text-primary" />}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="max-w-[300px] truncate text-sm font-semibold text-muted-foreground">{notice.body}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <CalendarDays size={13} className="text-primary" />
                        {format.date(notice.created_at, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-center">
                        {notice.is_pinned ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                            <Pin size={11} />
                            {t('pinned')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-[10px] font-bold text-primary">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            {t('active')}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Notices - Mobile Cards */}
        <div className="space-y-3 sm:hidden">
          {notices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Megaphone size={40} className="mb-2 text-muted-foreground" />
              <p className="text-sm font-bold text-muted-foreground">{t('empty')}</p>
            </div>
          ) : (
            notices.map((notice) => {
              const cfg = NOTICE_CONFIG[notice.type as NoticeType] || NOTICE_CONFIG.GENERAL
              return (
                <div key={notice.id} className="rounded-xl border border-border bg-background p-4  transition hover:border-primary">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold"
                      style={{ backgroundColor: cfg.bg, color: cfg.color, borderColor: 'var(--border)' }}
                    >
                      {cfg.icon}
                      {noticeTypeLabel(notice.type, locale)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {notice.is_pinned && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">
                          <Pin size={10} />
                          {t('pinned')}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[9px] font-bold text-primary">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {t('active')}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{notice.title}</h3>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground leading-relaxed">{notice.body}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
                    <CalendarDays size={11} className="text-primary" />
                    {format.date(notice.created_at, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Create Notice Drawer */}
      {showModal && (
        <EnterpriseDetailsDrawer
          open={showModal}
          onOpenChange={setShowModal}
          eyebrow={t('drawerEyebrow')}
          title={t('drawerTitle')}
          description={t('drawerDescription')}
          headerIcon={<Megaphone className="size-5" />}
          footer={<EnterpriseDrawerFooter><EnterpriseDrawerAction tone="secondary" onClick={() => setShowModal(false)} disabled={publishing}>{t('cancel')}</EnterpriseDrawerAction><EnterpriseDrawerAction priority="primary" tone="primary" onClick={publish} disabled={publishing || !title.trim() || !body.trim() || !activeMess}>{publishing ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}{publishing ? t('publishing') : t('publishNotice')}</EnterpriseDrawerAction></EnterpriseDrawerFooter>}
        >
            <div>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {t('noticeTitle')}
                  </label>
                  <input
                    className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
                    placeholder={t('titlePlaceholder')}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {t('noticeType')}
                  </label>
                  <EnterpriseSelect value={type} onValueChange={(value) => setType(value as NoticeType)} options={noticeTypes.map((item) => ({ value: item, label: noticeTypeLabel(item, locale) }))} />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {t('noticeContent')}
                  </label>
                  <textarea
                    className="min-h-[140px] w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
                    placeholder={t('contentPlaceholder')}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                </div>
              </div>
            </div>
        </EnterpriseDetailsDrawer>
      )}
    </div>
  )
}
