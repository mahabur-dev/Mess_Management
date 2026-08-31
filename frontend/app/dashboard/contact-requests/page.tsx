'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { apiClient, type ContactRequest, type ContactRequestSource, type ContactRequestStatus } from '@/lib/api-client'
import { CheckCircle2, Clock3, Loader2, Mail, Search, Send, Sparkles, UserRound, BadgeCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const STATUS_STYLES: Record<ContactRequestStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  CONTACTED: { label: 'Contacted', className: 'border-blue-200 bg-blue-50 text-blue-700' },
  RESOLVED: { label: 'Resolved', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
}

const SOURCE_LABELS: Record<ContactRequestSource, string> = {
  CONTACT: 'Contact',
  SUBSCRIPTION: 'Subscription',
  UPGRADE: 'Upgrade',
}

const SOURCE_STYLES: Record<ContactRequestSource, string> = {
  CONTACT: 'bg-slate-50 text-slate-700 border-slate-200',
  SUBSCRIPTION: 'bg-blue-50 text-blue-700 border-blue-200',
  UPGRADE: 'bg-amber-50 text-amber-700 border-amber-200',
}

function formatDate(value?: string | null) {
  if (!value) return 'N/A'
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function ContactRequestsPage() {
  const [requests, setRequests] = useState<ContactRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'' | ContactRequestStatus>('')
  const [filterSource, setFilterSource] = useState<'' | ContactRequestSource>('')

  async function load() {
    setLoading(true)
    try {
      const response = await apiClient.getContactRequests({ limit: 200 })
      setRequests(Array.isArray(response.data) ? response.data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filteredRequests = useMemo(() => {
    const term = search.trim().toLowerCase()
    return requests.filter((request) => {
      const matchesStatus = !filterStatus || request.status === filterStatus
      const matchesSource = !filterSource || request.source === filterSource
      const matchesSearch =
        !term ||
        request.name.toLowerCase().includes(term) ||
        request.email.toLowerCase().includes(term) ||
        (request.phone ?? '').toLowerCase().includes(term) ||
        request.description.toLowerCase().includes(term)
      return matchesStatus && matchesSource && matchesSearch
    })
  }, [filterSource, filterStatus, requests, search])

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((item) => item.status === 'PENDING').length,
      contacted: requests.filter((item) => item.status === 'CONTACTED').length,
      resolved: requests.filter((item) => item.status === 'RESOLVED').length,
    }
  }, [requests])

  async function updateStatus(id: string, status: ContactRequestStatus) {
    setUpdatingId(id)
    try {
      const response = await apiClient.reviewContactRequest(id, {
        status,
        adminNote: status === 'CONTACTED' ? 'Admin reached out to the user.' : 'Issue resolved.',
      })
      setRequests((current) => current.map((item) => (item.id === id ? response.data : item)))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#fafcff]">
      <DashboardHeader title="Contact Requests" description="All landing-page contacts, subscription inquiries, and upgrade requests in one place" />

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total Requests', value: stats.total, icon: Mail, tone: 'from-[#2f80ed] to-[#6f3df4]' },
            { label: 'Pending', value: stats.pending, icon: Clock3, tone: 'from-[#f59e0b] to-[#f97316]' },
            { label: 'Contacted', value: stats.contacted, icon: Send, tone: 'from-[#0ea5e9] to-[#2563eb]' },
            { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, tone: 'from-[#10b981] to-[#34d399]' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.label} className="rounded-2xl border border-[#e6ebf4] bg-white p-5 shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b7a99]">{item.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-[#172554]">{item.value}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r ${item.tone} text-white`}>
                    <Icon size={18} />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="mb-6 rounded-2xl border border-[#e6ebf4] bg-white p-4 shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_180px_180px]">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a9bb5]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, phone, or description"
                className="h-11 rounded-xl border-[#d8e6f8] bg-white pl-10 pr-4 text-sm font-semibold text-[#172554] placeholder:text-[#8a9bb5] focus-visible:border-[#2f80ed]/60 focus-visible:ring-[#2f80ed]/10"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value as '' | ContactRequestStatus)}
              className="h-11 rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#53617d] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
            >
              <option value="">All status</option>
              <option value="PENDING">Pending</option>
              <option value="CONTACTED">Contacted</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            <select
              value={filterSource}
              onChange={(event) => setFilterSource(event.target.value as '' | ContactRequestSource)}
              className="h-11 rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#53617d] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
            >
              <option value="">All source</option>
              <option value="CONTACT">Contact</option>
              <option value="SUBSCRIPTION">Subscription</option>
              <option value="UPGRADE">Upgrade</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-sm font-bold text-[#6b7a99]">
            <Loader2 size={18} className="animate-spin text-[#2f80ed]" />
            Loading contact requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d8e6f8] bg-white py-20 text-center shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
            <UserRound size={42} className="mx-auto text-[#d8e6f8]" />
            <p className="mt-4 text-sm font-bold text-[#6b7a99]">No contact requests found.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#e6ebf4] bg-white shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
            <div className="border-b border-[#e6ebf4] px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2f80ed]">Contact table</p>
                  <h2 className="text-lg font-semibold text-[#172554]">Submitted requests</h2>
                </div>
                <BadgeCheck size={18} className="text-[#2f80ed]" />
              </div>
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full divide-y divide-[#e6ebf4]">
                <thead className="bg-[#fafcff]">
                  <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b7a99]">
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3">Source</th>
                    <th className="px-5 py-3">Plan</th>
                    <th className="px-5 py-3">Description</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Submitted</th>
                    <th className="px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef2f8]">
                  {filteredRequests.map((request) => {
                    const status = STATUS_STYLES[request.status]
                    return (
                      <tr key={request.id} className="align-top hover:bg-[#fbfdff]">
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-[#172554]">{request.name}</p>
                          <p className="mt-0.5 text-xs font-semibold text-[#6b7a99]">{request.email}</p>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-[#53617d]">
                          <div>{request.phone || 'N/A'}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${SOURCE_STYLES[request.source]}`}>
                            {SOURCE_LABELS[request.source]}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-bold text-[#172554]">{request.requested_plan || 'N/A'}</td>
                        <td className="px-5 py-4">
                          <p className="max-w-[280px] text-sm font-semibold leading-6 text-[#53617d]">{request.description}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-[#53617d]">{formatDate(request.created_at)}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              disabled={updatingId === request.id || request.status === 'CONTACTED'}
                              onClick={() => void updateStatus(request.id, 'CONTACTED')}
                              className="h-8 rounded-lg bg-[#eef5ff] px-3 text-xs font-bold text-[#2f80ed] hover:bg-[#dfeeff]"
                            >
                              {updatingId === request.id ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                              Contacted
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              disabled={updatingId === request.id || request.status === 'RESOLVED'}
                              onClick={() => void updateStatus(request.id, 'RESOLVED')}
                              className="h-8 rounded-lg bg-emerald-50 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                            >
                              <CheckCircle2 size={13} />
                              Resolved
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 p-4 lg:hidden">
              {filteredRequests.map((request) => {
                const status = STATUS_STYLES[request.status]
                return (
                  <Card key={request.id} className="rounded-2xl border border-[#e6ebf4] bg-[#fafcff] p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-[#172554]">{request.name}</p>
                        <p className="mt-0.5 text-xs font-semibold text-[#6b7a99]">{request.email}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold ${status.className}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-[10px] font-semibold uppercase text-[#6b7a99]">Phone</p>
                        <p className="mt-1 font-bold text-[#172554]">{request.phone || 'N/A'}</p>
                      </div>
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-[10px] font-semibold uppercase text-[#6b7a99]">Source</p>
                        <p className="mt-1 font-bold text-[#172554]">{SOURCE_LABELS[request.source]}</p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm font-semibold leading-6 text-[#53617d]">{request.description}</p>
                    <p className="mt-3 text-xs font-semibold text-[#6b7a99]">Submitted: {formatDate(request.created_at)}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={updatingId === request.id || request.status === 'CONTACTED'}
                        onClick={() => void updateStatus(request.id, 'CONTACTED')}
                        className="h-8 rounded-lg bg-[#eef5ff] px-3 text-xs font-bold text-[#2f80ed] hover:bg-[#dfeeff]"
                      >
                        {updatingId === request.id ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                        Contacted
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={updatingId === request.id || request.status === 'RESOLVED'}
                        onClick={() => void updateStatus(request.id, 'RESOLVED')}
                        className="h-8 rounded-lg bg-emerald-50 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                      >
                        <CheckCircle2 size={13} />
                        Resolved
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
