'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { EnterpriseSelect } from '@/components/ui/enterprise-select'
import { apiClient, type ContactRequest, type ContactRequestSource, type ContactRequestStatus } from '@/lib/api-client'
import { CheckCircle2, Clock3, Loader2, Mail, Search, Send, UserRound, BadgeCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

const STATUS_STYLES: Record<ContactRequestStatus, { label: string; className: string }> = {
  PENDING: {
    label: 'Pending',
    className: 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-300 dark:hover:bg-amber-400/15',
  },
  CONTACTED: {
    label: 'Contacted',
    className: 'border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100 dark:border-blue-400/40 dark:bg-blue-400/10 dark:text-blue-300 dark:hover:bg-blue-400/15',
  },
  RESOLVED: {
    label: 'Resolved',
    className: 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-300 dark:hover:bg-emerald-400/15',
  },
}

const STATUS_OPTIONS = (Object.entries(STATUS_STYLES) as Array<
  [ContactRequestStatus, (typeof STATUS_STYLES)[ContactRequestStatus]]
>).map(([value, config]) => ({ value, label: config.label }))

const SOURCE_LABELS: Record<ContactRequestSource, string> = {
  CONTACT: 'Contact',
  SUBSCRIPTION: 'Subscription',
  UPGRADE: 'Upgrade',
}

const SOURCE_STYLES: Record<ContactRequestSource, string> = {
  CONTACT: 'bg-muted text-muted-foreground border-border',
  SUBSCRIPTION: 'bg-primary/10 text-primary border-primary/30',
  UPGRADE: 'bg-primary/10 text-primary border-primary/30',
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

  useEffect(() => {
    let active = true

    apiClient.getContactRequests({ limit: 200 })
      .then((response) => {
        if (active) setRequests(Array.isArray(response.data) ? response.data : [])
      })
      .catch(() => {
        if (active) toast.error('Could not load contact requests. Please try again.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
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
    const currentRequest = requests.find((request) => request.id === id)
    if (!currentRequest || currentRequest.status === status || updatingId) return

    setUpdatingId(id)
    try {
      const response = await apiClient.reviewContactRequest(id, { status })
      setRequests((current) => current.map((item) => (item.id === id ? response.data : item)))
      toast.success(`Status updated to ${STATUS_STYLES[status].label}.`)
    } catch {
      toast.error('Could not update the contact request status. Please try again.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title="Contact Requests" description="All landing-page contacts, subscription inquiries, and upgrade requests in one place" />

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total Requests', value: stats.total, icon: Mail, tone: 'bg-primary ' },
            { label: 'Pending', value: stats.pending, icon: Clock3, tone: 'bg-primary ' },
            { label: 'Contacted', value: stats.contacted, icon: Send, tone: 'bg-primary ' },
            { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, tone: 'bg-primary ' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.label} className="rounded-2xl border border-border bg-background p-5 ">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">{item.value}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl  ${item.tone} text-primary-foreground`}>
                    <Icon size={18} />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="mb-6 rounded-2xl border border-border bg-background p-4 ">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_180px_180px]">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, phone, or description"
                className="h-11 rounded-xl border-border bg-background pl-10 pr-4 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20"
              />
            </div>

            <EnterpriseSelect
              value={filterStatus || 'ALL'}
              onValueChange={(value) => setFilterStatus(value === 'ALL' ? '' : value as ContactRequestStatus)}
              ariaLabel="Filter contact requests by status"
              options={[
                { value: 'ALL', label: 'All status' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'CONTACTED', label: 'Contacted' },
                { value: 'RESOLVED', label: 'Resolved' },
              ]}
            />

            <EnterpriseSelect
              value={filterSource || 'ALL'}
              onValueChange={(value) => setFilterSource(value === 'ALL' ? '' : value as ContactRequestSource)}
              ariaLabel="Filter contact requests by source"
              options={[
                { value: 'ALL', label: 'All source' },
                { value: 'CONTACT', label: 'Contact' },
                { value: 'SUBSCRIPTION', label: 'Subscription' },
                { value: 'UPGRADE', label: 'Upgrade' },
              ]}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-sm font-bold text-muted-foreground">
            <Loader2 size={18} className="animate-spin text-primary" />
            Loading contact requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-background py-20 text-center ">
            <UserRound size={42} className="mx-auto text-muted-foreground" />
            <p className="mt-4 text-sm font-bold text-muted-foreground">No contact requests found.</p>
          </div>
        ) : (
          <div className="dashboard-table-frame">
            <div className="border-b border-border px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Contact table</p>
                  <h2 className="text-lg font-semibold text-foreground">Submitted requests</h2>
                </div>
                <BadgeCheck size={18} className="text-primary" />
              </div>
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3">Source</th>
                    <th className="px-5 py-3">Plan</th>
                    <th className="px-5 py-3">Description</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRequests.map((request) => {
                    const status = STATUS_STYLES[request.status]
                    return (
                      <tr key={request.id} className="align-top hover:bg-muted">
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-foreground">{request.name}</p>
                          <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{request.email}</p>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-muted-foreground">
                          <div>{request.phone || 'N/A'}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${SOURCE_STYLES[request.source]}`}>
                            {SOURCE_LABELS[request.source]}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-bold text-foreground">{request.requested_plan || 'N/A'}</td>
                        <td className="px-5 py-4">
                          <p className="max-w-[280px] text-sm font-semibold leading-6 text-muted-foreground">{request.description}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex min-w-[150px] items-center gap-2">
                            <EnterpriseSelect
                              value={request.status}
                              onValueChange={(value) => void updateStatus(request.id, value as ContactRequestStatus)}
                              disabled={updatingId === request.id}
                              ariaLabel={`Update status for ${request.name}`}
                              options={STATUS_OPTIONS}
                              className={`h-9 min-h-9 rounded-lg text-xs font-semibold ${status.className}`}
                            />
                            {updatingId === request.id && <Loader2 size={15} className="shrink-0 animate-spin text-primary" />}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-muted-foreground">{formatDate(request.created_at)}</td>
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
                  <Card key={request.id} className="rounded-2xl border border-border bg-muted p-4 ">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-foreground">{request.name}</p>
                        <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{request.email}</p>
                      </div>
                      <div className="w-[145px] shrink-0">
                        <EnterpriseSelect
                          value={request.status}
                          onValueChange={(value) => void updateStatus(request.id, value as ContactRequestStatus)}
                          disabled={updatingId === request.id}
                          ariaLabel={`Update status for ${request.name}`}
                          options={STATUS_OPTIONS}
                          className={`h-9 min-h-9 rounded-lg text-xs font-semibold ${status.className}`}
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-background p-3">
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">Phone</p>
                        <p className="mt-1 font-bold text-foreground">{request.phone || 'N/A'}</p>
                      </div>
                      <div className="rounded-xl bg-background p-3">
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">Source</p>
                        <p className="mt-1 font-bold text-foreground">{SOURCE_LABELS[request.source]}</p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm font-semibold leading-6 text-muted-foreground">{request.description}</p>
                    <p className="mt-3 text-xs font-semibold text-muted-foreground">Submitted: {formatDate(request.created_at)}</p>

                    {updatingId === request.id && (
                      <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                        <Loader2 size={14} className="animate-spin text-primary" />
                        Updating status...
                      </div>
                    )}
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
