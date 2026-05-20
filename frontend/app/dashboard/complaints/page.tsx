'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { apiClient, type Complaint, type ComplaintCategory, type Mess } from '@/lib/api-client'
import { useAuth } from '@/app/context/auth-context'
import { CheckCircle2, MessageSquareWarning, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'

const categories: ComplaintCategory[] = ['MEAL_CORRECTION', 'PAYMENT_CORRECTION', 'LEAVE_REQUEST', 'ROOM_ISSUE', 'FOOD_ISSUE', 'MAINTENANCE_ISSUE', 'OTHER']

export default function ComplaintsPage() {
  const [messes, setMesses] = useState<Mess[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ComplaintCategory>('MEAL_CORRECTION')
  const { user } = useAuth()
  const activeMess = messes[0] ?? user?.memberships?.[0]?.mess
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'ORGANIZER'

  async function load() {
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
    await apiClient.createComplaint({ messId: activeMess.id, title, description, category })
    setTitle('')
    setDescription('')
    await load()
  }

  async function solve(id: string) {
    await apiClient.updateComplaintStatus(id, { status: 'SOLVED', response: 'Solved by manager' })
    await load()
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Complaints & Requests" description="Meal corrections, payment corrections, leave requests and maintenance issues" />
      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[380px_1fr] lg:p-8">
        <Card className="app-card h-fit p-5">
          <h2 className="mb-4 text-lg font-black">Submit Request</h2>
          <div className="space-y-4">
            <input className="soft-input w-full" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <select className="soft-input w-full" value={category} onChange={(e) => setCategory(e.target.value as ComplaintCategory)}>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
            <textarea className="min-h-28 w-full rounded-lg border border-border bg-white p-3 text-sm outline-none focus:border-[#6f3df4] focus:ring-2 focus:ring-[#6f3df4]/15" placeholder="Describe the issue..." value={description} onChange={(e) => setDescription(e.target.value)} />
            <Button disabled={!activeMess} onClick={submit} className="gradient-button w-full rounded-lg font-bold">
              <Plus size={16} className="mr-2" /> Submit
            </Button>
          </div>
        </Card>

        <div className="space-y-3">
          {complaints.length === 0 && <Card className="app-card p-5 text-sm font-semibold text-muted-foreground">No complaints yet.</Card>}
          {complaints.map((complaint) => (
            <Card key={complaint.id} className="app-card p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#ffe8f0] text-[#f43f7f]"><MessageSquareWarning size={20} /></span>
                  <div>
                    <p className="text-xs font-black text-[#6f3df4]">{complaint.category}</p>
                    <h3 className="mt-1 text-lg font-black">{complaint.title}</h3>
                    <p className="mt-1 text-sm font-semibold text-muted-foreground">{complaint.description}</p>
                    <p className="mt-3 text-xs font-black">Status: {complaint.status}</p>
                  </div>
                </div>
                {isManager && complaint.status !== 'SOLVED' && (
                  <Button size="sm" onClick={() => solve(complaint.id)} className="bg-[#22b66f] hover:bg-[#1fa463]">
                    <CheckCircle2 size={15} className="mr-2" /> Solve
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
