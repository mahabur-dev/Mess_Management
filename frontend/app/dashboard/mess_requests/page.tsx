'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { apiClient } from '@/lib/api-client'
import { Check, ClipboardList, Eye, Loader2, X, Building2, MapPin, Users, Banknote, CalendarDays, CheckCircle2, XCircle, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface MessRequest {
  id: string
  mess_name: string
  address?: string | null
  total_seats?: number | null
  monthly_rent?: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  requester?: { name: string; email: string; phone?: string | null }
  created_at?: string
}

const formatDate = (iso: string) => {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', icon: <Loader2 size={12} className="animate-spin" />, bg: 'bg-primary/10', text: 'text-primary', border: 'color-mix(in srgb, var(--primary) 30%, transparent)' },
  APPROVED: { label: 'Approved', icon: <CheckCircle2 size={12} />, bg: 'bg-primary/10', text: 'text-primary', border: 'color-mix(in srgb, var(--primary) 30%, transparent)' },
  REJECTED: { label: 'Rejected', icon: <XCircle size={12} />, bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/30' },
}

export default function MessRequestsPage() {
  const [requests, setRequests] = useState<MessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [viewingRequest, setViewingRequest] = useState<MessRequest | null>(null)

  async function load() {
    setLoading(true)
    try {
      const response = await apiClient.getMessRequests({ limit: 50 })
      setRequests(Array.isArray(response.data) ? (response.data as MessRequest[]) : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function review(id: string, status: 'APPROVED' | 'REJECTED') {
    setReviewingId(id)
    try {
      await apiClient.reviewMessRequest(id, { status })
      await load()
    } finally {
      setReviewingId(null)
    }
  }

  async function deleteRequest(id: string) {
    if (!confirm('Are you sure you want to delete this request?')) return
    setDeletingId(id)
    try {
      await apiClient.deleteMessRequest(id)
      await load()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title="Mess Requests" description="Super admin review queue for new mess registrations" />

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-7 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl r bg-primary/10  ">
            <ClipboardList size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Registration Requests</h2>
            <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{requests.length} request{requests.length !== 1 ? 's' : ''} found</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm font-bold text-muted-foreground">
            <Loader2 size={20} className="animate-spin text-primary" />
            Loading requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-border bg-background ">
            <ClipboardList size={48} className="mb-3 text-muted-foreground" />
            <p className="text-sm font-bold text-muted-foreground">No mess registration requests yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {requests.map((request) => {
              const statusCfg = STATUS_CONFIG[request.status] || STATUS_CONFIG.PENDING
              const isReviewing = reviewingId === request.id
              const isDeleting = deletingId === request.id
              return (
                <div
                  key={request.id}
                  className="group relative overflow-hidden rounded-lg border border-border bg-background transition-colors hover:border-primary"
                >
                  <div className="absolute inset-x-0 top-0 h-1  bg-primary  " />
                  
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl r bg-primary/10  ">
                          <Building2 size={20} className="text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-foreground truncate">{request.mess_name}</h3>
                          {request.address && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                              <MapPin size={11} className="text-primary" />
                              <span className="truncate">{request.address}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted p-3 mb-4">
                      <div>
                        <p className="flex items-center gap-1 text-[10px] font-semibold uppercase text-muted-foreground">
                          <Users size={11} className="text-primary" />
                          Seats
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-foreground">{request.total_seats ?? '-'}</p>
                      </div>
                      <div>
                        <p className="flex items-center gap-1 text-[10px] font-semibold uppercase text-muted-foreground">
                          <Banknote size={11} className="text-primary" />
                          Rent
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-foreground">৳ {Number(request.monthly_rent ?? 0).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="mb-4 border border-border rounded-lg p-3">
                      <p className="text-xs font-semibold text-muted-foreground">Requested by</p>
                      <p className="text-sm font-bold text-foreground">{request.requester?.name || 'Unknown'}</p>
                      <p className="text-xs font-semibold text-muted-foreground">{request.requester?.email || ''}</p>
                    </div>

                    {request.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => review(request.id, 'APPROVED')}
                          disabled={isReviewing}
                          className="flex-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 text-xs font-bold text-primary transition hover:border-primary/40 hover:bg-primary/10 disabled:opacity-60"
                        >
                          {isReviewing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          Approve
                        </button>
                        <button
                          onClick={() => review(request.id, 'REJECTED')}
                          disabled={isReviewing}
                          className="flex-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 text-xs font-bold text-destructive transition hover:border-destructive/30 hover:bg-destructive/10 disabled:opacity-60"
                        >
                          <X size={14} />
                          Reject
                        </button>
                      </div>
                    )}
                    
                    {/* Bottom action buttons */}
                    <div className="mt-3 flex items-center justify-end gap-2 border-t border-border pt-3">
                      <button
                        onClick={() => setViewingRequest(request)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-3 text-xs font-bold text-primary transition hover:bg-primary/10"
                      >
                        <Eye size={13} />
                        View
                      </button>
                      <button
                        onClick={() => deleteRequest(request.id)}
                        disabled={isDeleting}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 text-xs font-bold text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
                      >
                        {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* View Detail Modal */}
        {viewingRequest && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={(e) => e.target === e.currentTarget && setViewingRequest(null)}
          >
            <div className="relative w-full max-w-[480px] overflow-hidden rounded-lg border border-border bg-background">
              <div className="absolute inset-x-0 top-0 h-1.5  bg-primary  " />
              
              <div className="relative flex items-center justify-between border-b border-border px-5 py-5 sm:px-6">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Mess Request</p>
                  <h2 className="mt-1 text-xl font-semibold text-foreground truncate">{viewingRequest.mess_name}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingRequest(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted text-primary transition hover:border-primary hover:bg-muted"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="relative max-h-[calc(100vh-120px)] overflow-y-auto p-5 sm:p-6">
                {/* Status badge */}
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">Status</span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${STATUS_CONFIG[viewingRequest.status].bg} ${STATUS_CONFIG[viewingRequest.status].text} ${STATUS_CONFIG[viewingRequest.status].border}`}>
                    {STATUS_CONFIG[viewingRequest.status].icon}
                    {STATUS_CONFIG[viewingRequest.status].label}
                  </span>
                </div>
                
                {/* Basic info */}
                <div className="mb-4 space-y-3">
                  <div className="rounded-lg border border-border bg-muted p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Mess Name</p>
                    <p className="mt-1 text-sm font-bold text-foreground">{viewingRequest.mess_name}</p>
                  </div>
                  {viewingRequest.address && (
                    <div className="rounded-lg border border-border bg-muted p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Address</p>
                      <p className="mt-1 text-sm font-bold text-foreground">{viewingRequest.address}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border bg-muted p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Total Seats</p>
                      <p className="mt-1 text-sm font-bold text-foreground">{viewingRequest.total_seats ?? '-'}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Monthly Rent</p>
                      <p className="mt-1 text-sm font-bold text-foreground">৳ {Number(viewingRequest.monthly_rent ?? 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Requester info */}
                <div className="mb-4 rounded-lg border border-border p-3">
                  <p className="mb-2 text-xs font-bold text-muted-foreground">Requested By</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl r bg-primary/10  text-sm font-semibold text-primary">
                      {viewingRequest.requester?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{viewingRequest.requester?.name || 'Unknown'}</p>
                      <p className="text-xs font-semibold text-muted-foreground">{viewingRequest.requester?.email || ''}</p>
                      {viewingRequest.requester?.phone && (
                        <p className="text-xs font-semibold text-muted-foreground">{viewingRequest.requester.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Created at */}
                {viewingRequest.created_at && (
                  <div className="rounded-lg border border-border bg-muted p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Submitted</p>
                    <p className="mt-1 text-sm font-bold text-foreground">{formatDate(viewingRequest.created_at)}</p>
                  </div>
                )}

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setViewingRequest(null)}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl  bg-primary  px-6 font-semibold text-primary-foreground  transition "
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
