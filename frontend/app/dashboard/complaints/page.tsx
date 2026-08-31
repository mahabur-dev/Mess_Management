'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { EnterpriseButton } from '@/components/ui/enterprise-button'
import { EnterpriseDetailsDrawer } from '@/components/ui/enterprise-details-drawer'
import { EnterpriseIconButton } from '@/components/ui/enterprise-icon-button'
import { EnterpriseSelect } from '@/components/ui/enterprise-select'
import { apiClient, type Complaint, type ComplaintCategory, type Mess } from '@/lib/api-client'
import { useAuth } from '@/app/context/auth-context'
import { CheckCircle2, MessageSquareWarning, Plus, Trash2, X, Loader2, AlertCircle, CalendarDays, User } from 'lucide-react'
import { useEffect, useState } from 'react'

const categories: ComplaintCategory[] = ['MEAL_CORRECTION', 'PAYMENT_CORRECTION', 'LEAVE_REQUEST', 'ROOM_ISSUE', 'FOOD_ISSUE', 'MAINTENANCE_ISSUE', 'OTHER']

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  MEAL_CORRECTION: { label: 'Meal Correction', color: '#0f766e', bg: '#f0fdfa' },
  PAYMENT_CORRECTION: { label: 'Payment Correction', color: '#6d28d9', bg: '#f5f3ff' },
  LEAVE_REQUEST: { label: 'Leave Request', color: '#2563eb', bg: '#eff6ff' },
  ROOM_ISSUE: { label: 'Room Issue', color: '#d97706', bg: '#fffbeb' },
  FOOD_ISSUE: { label: 'Food Issue', color: '#dc2626', bg: '#fef2f2' },
  MAINTENANCE_ISSUE: { label: 'Maintenance', color: '#0891b2', bg: '#ecfeff' },
  OTHER: { label: 'Other', color: '#6366f1', bg: '#eef2ff' },
}

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/50' },
  SOLVED: { label: 'Solved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/50' },
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

export default function ComplaintsPage() {
  const [messes, setMesses] = useState<Mess[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ComplaintCategory>('MEAL_CORRECTION')
  const { user } = useAuth()
  const activeMess = messes[0] ?? user?.memberships?.[0]?.mess
  const isAdmin = user?.role === 'ADMIN'
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const canSubmitComplaint = user?.role === 'MEMBER'
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    if (isAdmin) {
      const complaintRes = await apiClient.getAllComplaints().catch(() => null)
      setComplaints(Array.isArray(complaintRes?.data) ? complaintRes.data : [])
      return
    }

    const messRes = await apiClient.getMesses().catch(() => null)
    const list = Array.isArray(messRes?.data)
      ? messRes.data
      : messRes?.data
        ? [messRes.data]
        : ((user?.memberships?.map((item) => item.mess).filter(Boolean) ?? []) as Mess[])
    setMesses(list)
    if (list[0]) {
      const complaintRes = isManager ? await apiClient.getComplaintsByMess(list[0].id).catch(() => null) : await apiClient.getMyComplaints().catch(() => null)
      setComplaints(Array.isArray(complaintRes?.data) ? complaintRes.data : [])
    }
  }

  useEffect(() => {
    load()
  }, [user?.role])

  async function submit() {
    if (!activeMess || !title.trim() || !description.trim()) return
    setSubmitting(true)
    try {
      await apiClient.createComplaint({ messId: activeMess.id, title, description, category })
      setTitle('')
      setDescription('')
      setShowModal(false)
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  async function solve(id: string) {
    await apiClient.updateComplaintStatus(id, { status: 'SOLVED', response: 'Solved by manager' })
    await load()
  }

  async function remove(id: string) {
    setComplaints((current) => current.filter((complaint) => complaint.id !== id))
    await apiClient.deleteComplaint(id).catch(() => {
      void load()
    })
  }

  return (
    <div className="min-h-screen bg-[#fafcff]">
      <DashboardHeader title="Complaints & Requests" description="Meal corrections, payment corrections, leave requests and maintenance issues" />

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-50 to-rose-100 shadow-sm">
              <MessageSquareWarning size={24} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#172554]">{isManager ? 'All Complaints' : 'My Complaints'}</h2>
              <p className="mt-0.5 text-xs font-semibold text-[#6b7a99]">{complaints.length} complaint{complaints.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {canSubmitComplaint && (
            <EnterpriseButton onClick={() => setShowModal(true)} className="gap-2">
              <Plus size={18} />
              Submit Complaint
            </EnterpriseButton>
          )}
        </div>

        {/* Complaints Table - Desktop */}
        <div className="hidden sm:block overflow-hidden rounded-xl border border-[#e6ebf4] bg-white shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e6ebf4] bg-[#f8faff]">
                <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Category</th>
                <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Title</th>
                <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Description</th>
                <th className="whitespace-nowrap px-5 py-4 text-center text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Status</th>
                {isManager && <th className="whitespace-nowrap px-5 py-4 text-right text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6ebf4]">
              {complaints.length === 0 && (
                <tr>
                  <td colSpan={isManager ? 5 : 4} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <MessageSquareWarning size={40} className="text-[#d8e6f8]" />
                      <p className="text-sm font-bold text-[#6b7a99]">No complaints yet.</p>
                    </div>
                  </td>
                </tr>
              )}
              {complaints.map((complaint) => {
                const catCfg = CATEGORY_CONFIG[complaint.category] || CATEGORY_CONFIG.OTHER
                const statusCfg = STATUS_CONFIG[complaint.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING
                return (
                  <tr key={complaint.id} className="transition hover:bg-[#f8faff] group">
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold"
                        style={{ backgroundColor: catCfg.bg, color: catCfg.color, borderColor: `${catCfg.color}33` }}
                      >
                        {catCfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-[#172554]">{complaint.title}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="max-w-xs truncate text-sm font-semibold text-[#6b7a99]">{complaint.description}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                          {complaint.status === 'SOLVED' ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                          {statusCfg.label}
                        </span>
                      </div>
                    </td>
                    {isManager && (
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {complaint.status !== 'SOLVED' && (
                            <EnterpriseButton size="sm" tone="success" onClick={() => solve(complaint.id)}>
                              <CheckCircle2 size={13} />
                              Solve
                            </EnterpriseButton>
                          )}
                          <EnterpriseIconButton label="Delete complaint" tone="danger" className="size-8 rounded-lg" onClick={() => void remove(complaint.id)}>
                            <Trash2 size={14} />
                          </EnterpriseIconButton>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Complaints - Mobile Cards */}
        <div className="space-y-3 sm:hidden">
          {complaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <MessageSquareWarning size={40} className="mb-2 text-[#d8e6f8]" />
              <p className="text-sm font-bold text-[#6b7a99]">No complaints yet.</p>
            </div>
          ) : (
            complaints.map((complaint) => {
              const catCfg = CATEGORY_CONFIG[complaint.category] || CATEGORY_CONFIG.OTHER
              const statusCfg = STATUS_CONFIG[complaint.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING
              return (
                <div key={complaint.id} className="rounded-xl border border-[#e6ebf4] bg-white p-4 shadow-sm transition hover:border-[#a9ccfb]">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span
                      className="inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[10px] font-bold"
                      style={{ backgroundColor: catCfg.bg, color: catCfg.color, borderColor: `${catCfg.color}33` }}
                    >
                      {catCfg.label}
                    </span>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                      {complaint.status === 'SOLVED' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                      {statusCfg.label}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#172554]">{complaint.title}</h3>
                  <p className="mt-1 text-xs font-semibold text-[#6b7a99] leading-relaxed">{complaint.description}</p>
                  {isManager && (
                    <div className="mt-3 flex gap-2">
                      {complaint.status !== 'SOLVED' && (
                        <EnterpriseButton size="sm" tone="success" className="flex-1" onClick={() => solve(complaint.id)}>
                          <CheckCircle2 size={13} />
                          Solve
                        </EnterpriseButton>
                      )}
                      <EnterpriseIconButton label="Delete complaint" tone="danger" onClick={() => void remove(complaint.id)}>
                        <Trash2 size={14} />
                      </EnterpriseIconButton>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Submit Complaint Drawer */}
      {showModal && (
        <EnterpriseDetailsDrawer
          open={showModal}
          onOpenChange={setShowModal}
          eyebrow="Complaints"
          title="Submit complaint"
          description="Share the issue clearly so your manager can resolve it."
          headerIcon={<MessageSquareWarning className="size-5" />}
        >
            <div>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Title</label>
                  <input
                    className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                    placeholder="Enter complaint title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Category</label>
                  <EnterpriseSelect value={category} onValueChange={(value) => setCategory(value as ComplaintCategory)} options={categories.map((item) => ({ value: item, label: CATEGORY_CONFIG[item].label }))} />
                </div>
                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Description</label>
                  <textarea
                    className="min-h-[140px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 py-3 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                    placeholder="Describe the issue..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.6fr]">
                <EnterpriseButton tone="secondary" size="lg" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</EnterpriseButton>
                <EnterpriseButton size="lg" onClick={submit} disabled={submitting || !title.trim() || !description.trim() || !activeMess} className="gap-2">
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  {submitting ? 'Submitting...' : 'Submit Complaint'}
                </EnterpriseButton>
              </div>
            </div>
        </EnterpriseDetailsDrawer>
      )}
    </div>
  )
}
