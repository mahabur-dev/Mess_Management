'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
            <Button
              onClick={() => setShowModal(true)}
              className="h-[45px] gap-2 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-5 font-black text-white shadow-[0_8px_20px_rgba(47,128,237,0.25)] transition hover:shadow-[0_12px_28px_rgba(47,128,237,0.32)]"
            >
              <Plus size={18} />
              Create Notice
            </Button>
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

      {/* Create Notice Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#120a33]/65 p-4 backdrop-blur-md"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="relative w-full max-w-[520px] overflow-hidden rounded-xl border border-white/70 bg-white/90 shadow-[0_28px_80px_rgba(65,103,153,0.26)] backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#2f80ed] via-[#8b5cf6] to-[#f43f8f]" />
            <div className="absolute -right-14 -top-14 h-36 w-36 rounded-full bg-[#2f80ed]/12 blur-2xl" />

            <div className="relative flex items-center justify-between border-b border-[#d8e6f8] px-5 py-5 sm:px-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2f80ed]">Notice Board</p>
                <h2 className="mt-1 text-xl font-black text-[#172554]">Create New Notice</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8e6f8] bg-[#e7f1ff] text-[#2f80ed] transition hover:border-[#a9ccfb] hover:bg-[#dcebff]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative p-5 sm:p-6">
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
                  <select
                    className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-bold text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                    value={type}
                    onChange={(e) => setType(e.target.value as NoticeType)}
                  >
                    {noticeTypes.map((item) => {
                      const cfg = NOTICE_CONFIG[item]
                      return (
                        <option key={item} value={item}>{cfg.label}</option>
                      )
                    })}
                  </select>
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
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={publishing}
                  className="h-12 rounded-xl border border-[#d8e6f8] bg-white px-4 font-black text-[#53617d] transition hover:bg-[#edf5ff] disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={publish}
                  disabled={publishing || !title.trim() || !body.trim() || !activeMess}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-4 font-black text-white shadow-[0_16px_35px_rgba(47,128,237,0.30)] transition hover:shadow-[0_20px_42px_rgba(47,128,237,0.38)] disabled:opacity-70"
                >
                  {publishing ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  {publishing ? 'Publishing...' : 'Publish Notice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
