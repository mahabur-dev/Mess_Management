'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { EnterpriseButton } from '@/components/ui/enterprise-button'
import { EnterpriseDetailsDrawer } from '@/components/ui/enterprise-details-drawer'
import { EnterpriseSelect } from '@/components/ui/enterprise-select'
import { apiClient, type Mess, type Notice, type NoticeType } from '@/lib/api-client'
import { useAuth } from '@/app/context/auth-context'
import { Bell, Pin, Plus, X, Loader2, Megaphone, CalendarDays, AlertCircle, MessageCircle, FileText, Home } from 'lucide-react'
import { useEffect, useState } from 'react'

const noticeTypes: NoticeType[] = ['MEAL', 'PAYMENT', 'EMERGENCY', 'MEETING', 'RULE_UPDATE', 'GENERAL']

const NOTICE_CONFIG: Record<NoticeType, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  MEAL: { label: 'Meal', icon: <Bell size={14} />, color: '#0f766e', bg: '#f0fdfa' },
  PAYMENT: { label: 'Payment', icon: <Bell size={14} />, color: '#6d28d9', bg: '#f5f3ff' },
  EMERGENCY: { label: 'Emergency', icon: <AlertCircle size={14} />, color: '#dc2626', bg: '#fef2f2' },
  MEETING: { label: 'Meeting', icon: <MessageCircle size={14} />, color: '#2563eb', bg: '#eff6ff' },
  RULE_UPDATE: { label: 'Rule Update', icon: <FileText size={14} />, color: '#d97706', bg: '#fffbeb' },
  GENERAL: { label: 'General', icon: <Megaphone size={14} />, color: '#6366f1', bg: '#eef2ff' },
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

export default function NoticesPage() {
  const [messes, setMesses] = useState<Mess[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState<NoticeType>('GENERAL')
  const { user } = useAuth()
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
    <div className="min-h-screen bg-[#fafcff]">
      <DashboardHeader title="Notice Board" description="Post meal, payment, meeting and emergency notices" />

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#2f80ed]/15 to-[#8b5cf6]/15 shadow-sm">
              <Megaphone size={24} className="text-[#8b5cf6]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#172554]">All Notices</h2>
              <p className="mt-0.5 text-xs font-semibold text-[#6b7a99]">
                {notices.length} notice{notices.length !== 1 ? 's' : ''} posted
              </p>
            </div>
          </div>
          {isManager && (
            <EnterpriseButton onClick={() => setShowModal(true)} className="gap-2">
              <Plus size={18} />
              Create Notice
            </EnterpriseButton>
          )}
        </div>

        {/* Notices Table - Desktop */}
        <div className="hidden sm:block overflow-hidden rounded-xl border border-[#e6ebf4] bg-white shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e6ebf4] bg-[#f8faff]">
                <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Type</th>
                <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Title</th>
                <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Content</th>
                <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Date</th>
                <th className="whitespace-nowrap px-5 py-4 text-center text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6ebf4]">
              {notices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Megaphone size={40} className="text-[#d8e6f8]" />
                      <p className="text-sm font-bold text-[#6b7a99]">No notices yet.</p>
                    </div>
                  </td>
                </tr>
              )}
              {notices.map((notice) => {
                const cfg = NOTICE_CONFIG[notice.type as NoticeType] || NOTICE_CONFIG.GENERAL
                return (
                  <tr key={notice.id} className="transition hover:bg-[#f8faff] group">
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold"
                        style={{ backgroundColor: cfg.bg, color: cfg.color, borderColor: `${cfg.color}33` }}
                      >
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[#172554]">{notice.title}</p>
                        {notice.is_pinned && <Pin size={14} className="shrink-0 text-amber-500" />}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="max-w-[300px] truncate text-sm font-semibold text-[#6b7a99]">{notice.body}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6b7a99]">
                        <CalendarDays size={13} className="text-[#ffb84d]" />
                        {formatDate(notice.created_at)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-center">
                        {notice.is_pinned ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/60 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                            <Pin size={11} />
                            Pinned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#d8e6f8] bg-[#edf5ff] px-2.5 py-1 text-[10px] font-bold text-[#2f80ed]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#2f80ed]" />
                            Active
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
              <Megaphone size={40} className="mb-2 text-[#d8e6f8]" />
              <p className="text-sm font-bold text-[#6b7a99]">No notices yet.</p>
            </div>
          ) : (
            notices.map((notice) => {
              const cfg = NOTICE_CONFIG[notice.type as NoticeType] || NOTICE_CONFIG.GENERAL
              return (
                <div key={notice.id} className="rounded-xl border border-[#e6ebf4] bg-white p-4 shadow-sm transition hover:border-[#a9ccfb]">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold"
                      style={{ backgroundColor: cfg.bg, color: cfg.color, borderColor: `${cfg.color}33` }}
                    >
                      {cfg.icon}
                      {cfg.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {notice.is_pinned && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/60 bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                          <Pin size={10} />
                          Pinned
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#d8e6f8] bg-[#edf5ff] px-2 py-0.5 text-[9px] font-bold text-[#2f80ed]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#2f80ed]" />
                        Active
                      </span>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-[#172554]">{notice.title}</h3>
                  <p className="mt-1 text-xs font-semibold text-[#6b7a99] leading-relaxed">{notice.body}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-[#8a9bb5]">
                    <CalendarDays size={11} className="text-[#ffb84d]" />
                    {formatDate(notice.created_at)}
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
          eyebrow="Notice board"
          title="Create new notice"
          description="Share a clear update with everyone in the mess."
          headerIcon={<Megaphone className="size-5" />}
        >
            <div>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                    Notice Title
                  </label>
                  <input
                    className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                    placeholder="Enter notice title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                    Notice Type
                  </label>
                  <EnterpriseSelect value={type} onValueChange={(value) => setType(value as NoticeType)} options={noticeTypes.map((item) => ({ value: item, label: NOTICE_CONFIG[item].label }))} />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                    Notice Content
                  </label>
                  <textarea
                    className="min-h-[140px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 py-3 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                    placeholder="Write your notice content..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.6fr]">
                <EnterpriseButton tone="secondary" size="lg" onClick={() => setShowModal(false)} disabled={publishing}>Cancel</EnterpriseButton>
                <EnterpriseButton size="lg" onClick={publish} disabled={publishing || !title.trim() || !body.trim() || !activeMess} className="gap-2">
                  {publishing ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  {publishing ? 'Publishing...' : 'Publish Notice'}
                </EnterpriseButton>
              </div>
            </div>
        </EnterpriseDetailsDrawer>
      )}
    </div>
  )
}
