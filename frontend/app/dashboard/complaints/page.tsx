'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { EnterpriseButton } from '@/components/ui/enterprise-button'
import { EnterpriseDetailsDrawer } from '@/components/ui/enterprise-details-drawer'
import { EnterpriseDrawerAction, EnterpriseDrawerFooter } from '@/components/ui/enterprise-drawer-footer'
import { EnterpriseIconButton } from '@/components/ui/enterprise-icon-button'
import { EnterpriseSelect } from '@/components/ui/enterprise-select'
import { EnterpriseTableActionCell, EnterpriseTableActionHeader } from '@/components/ui/enterprise-table-actions'
import { apiClient, type Complaint, type ComplaintCategory, type Mess } from '@/lib/api-client'
import { useAuth } from '@/app/context/auth-context'
import { CheckCircle2, MessageSquareWarning, Plus, Trash2, X, Loader2, AlertCircle, CalendarDays, User } from 'lucide-react'
import { useEffect, useState } from 'react'

const categories: ComplaintCategory[] = ['MEAL_CORRECTION', 'PAYMENT_CORRECTION', 'LEAVE_REQUEST', 'ROOM_ISSUE', 'FOOD_ISSUE', 'MAINTENANCE_ISSUE', 'OTHER']

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  MEAL_CORRECTION: { label: 'Meal Correction', color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
  PAYMENT_CORRECTION: { label: 'Payment Correction', color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
  LEAVE_REQUEST: { label: 'Leave Request', color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
  ROOM_ISSUE: { label: 'Room Issue', color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
  FOOD_ISSUE: { label: 'Food Issue', color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
  MAINTENANCE_ISSUE: { label: 'Maintenance', color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
  OTHER: { label: 'Other', color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
}

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', bg: 'bg-primary/10', text: 'text-primary', border: 'color-mix(in srgb, var(--primary) 30%, transparent)' },
  SOLVED: { label: 'Solved', bg: 'bg-primary/10', text: 'text-primary', border: 'color-mix(in srgb, var(--primary) 30%, transparent)' },
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
    <div className="min-h-screen bg-background">
      <DashboardHeader title="Complaints & Requests" description="Meal corrections, payment corrections, leave requests and maintenance issues" />

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <MessageSquareWarning size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{isManager ? 'All Complaints' : 'My Complaints'}</h2>
              <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{complaints.length} complaint{complaints.length !== 1 ? 's' : ''}</p>
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
        <div className="dashboard-table-frame hidden sm:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Category</th>
                <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Title</th>
                <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Description</th>
                <th className="whitespace-nowrap px-5 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Status</th>
                {isManager && <EnterpriseTableActionHeader />}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {complaints.length === 0 && (
                <tr>
                  <td colSpan={isManager ? 5 : 4} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <MessageSquareWarning size={40} className="text-muted-foreground" />
                      <p className="text-sm font-bold text-muted-foreground">No complaints yet.</p>
                    </div>
                  </td>
                </tr>
              )}
              {complaints.map((complaint) => {
                const catCfg = CATEGORY_CONFIG[complaint.category] || CATEGORY_CONFIG.OTHER
                const statusCfg = STATUS_CONFIG[complaint.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING
                return (
                  <tr key={complaint.id} className="transition hover:bg-muted group">
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold"
                        style={{ backgroundColor: catCfg.bg, color: catCfg.color, borderColor: 'var(--border)' }}
                      >
                        {catCfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-foreground">{complaint.title}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="max-w-xs truncate text-sm font-semibold text-muted-foreground">{complaint.description}</p>
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
                      <EnterpriseTableActionCell>
                          {complaint.status !== 'SOLVED' && (
                            <EnterpriseButton size="sm" tone="success" onClick={() => solve(complaint.id)}>
                              <CheckCircle2 size={13} />
                              Solve
                            </EnterpriseButton>
                          )}
                          <EnterpriseIconButton label="Delete complaint" tone="danger" className="size-8 rounded-lg" onClick={() => void remove(complaint.id)}>
                            <Trash2 size={14} />
                          </EnterpriseIconButton>
                      </EnterpriseTableActionCell>
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
              <MessageSquareWarning size={40} className="mb-2 text-muted-foreground" />
              <p className="text-sm font-bold text-muted-foreground">No complaints yet.</p>
            </div>
          ) : (
            complaints.map((complaint) => {
              const catCfg = CATEGORY_CONFIG[complaint.category] || CATEGORY_CONFIG.OTHER
              const statusCfg = STATUS_CONFIG[complaint.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING
              return (
                <div key={complaint.id} className="rounded-xl border border-border bg-background p-4  transition hover:border-primary">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span
                      className="inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[10px] font-bold"
                      style={{ backgroundColor: catCfg.bg, color: catCfg.color, borderColor: 'var(--border)' }}
                    >
                      {catCfg.label}
                    </span>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                      {complaint.status === 'SOLVED' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                      {statusCfg.label}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{complaint.title}</h3>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground leading-relaxed">{complaint.description}</p>
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
          footer={<EnterpriseDrawerFooter><EnterpriseDrawerAction tone="secondary" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</EnterpriseDrawerAction><EnterpriseDrawerAction priority="primary" tone="primary" onClick={submit} disabled={submitting || !title.trim() || !description.trim() || !activeMess}>{submitting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}{submitting ? 'Submitting...' : 'Submit Complaint'}</EnterpriseDrawerAction></EnterpriseDrawerFooter>}
        >
            <div>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Title</label>
                  <input
                    className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
                    placeholder="Enter complaint title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Category</label>
                  <EnterpriseSelect value={category} onValueChange={(value) => setCategory(value as ComplaintCategory)} options={categories.map((item) => ({ value: item, label: CATEGORY_CONFIG[item].label }))} />
                </div>
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Description</label>
                  <textarea
                    className="min-h-[140px] w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
                    placeholder="Describe the issue..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
            </div>
        </EnterpriseDetailsDrawer>
      )}
    </div>
  )
}
