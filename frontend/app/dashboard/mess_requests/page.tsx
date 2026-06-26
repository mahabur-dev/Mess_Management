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
  PENDING: { label: 'Pending', icon: <Loader2 size={12} className="animate-spin" />, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/50' },
  APPROVED: { label: 'Approved', icon: <CheckCircle2 size={12} />, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/50' },
  REJECTED: { label: 'Rejected', icon: <XCircle size={12} />, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200/50' },
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
    <div className="min-h-screen bg-[#fafcff]">
      <DashboardHeader title="Mess Requests" description="Super admin review queue for new mess registrations" />

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-7 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#2f80ed]/15 to-[#8b5cf6]/15 shadow-sm">
            <ClipboardList size={24} className="text-[#8b5cf6]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#172554]">Registration Requests</h2>
            <p className="mt-0.5 text-xs font-semibold text-[#6b7a99]">{requests.length} request{requests.length !== 1 ? 's' : ''} found</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm font-bold text-[#6b7a99]">
            <Loader2 size={20} className="animate-spin text-[#2f80ed]" />
            Loading requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-[#e6ebf4] bg-white shadow-sm">
            <ClipboardList size={48} className="mb-3 text-[#d8e6f8]" />
            <p className="text-sm font-bold text-[#6b7a99]">No mess registration requests yet.</p>
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
                  className="group relative overflow-hidden rounded-xl border border-[#e6ebf4] bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-[#a9ccfb] hover:shadow-md"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2f80ed] via-[#58d68d] to-[#ffb84d]" />
                  
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2f80ed]/10 to-[#8b5cf6]/10 shadow-sm">
                          <Building2 size={20} className="text-[#2f80ed]" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-black text-[#172554] truncate">{request.mess_name}</h3>
                          {request.address && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-[#6b7a99]">
                              <MapPin size={11} className="text-[#ffb84d]" />
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

                    <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#f8faff] p-3 mb-4">
                      <div>
                        <p className="flex items-center gap-1 text-[10px] font-black uppercase text-[#6b7a99]">
                          <Users size={11} className="text-[#2f80ed]" />
                          Seats
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-[#172554]">{request.total_seats ?? '-'}</p>
                      </div>
                      <div>
                        <p className="flex items-center gap-1 text-[10px] font-black uppercase text-[#6b7a99]">
                          <Banknote size={11} className="text-[#f59e0b]" />
                          Rent
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-[#172554]">৳ {Number(request.monthly_rent ?? 0).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="mb-4 border border-[#e6ebf4] rounded-lg p-3">
                      <p className="text-xs font-semibold text-[#6b7a99]">Requested by</p>
                      <p className="text-sm font-bold text-[#172554]">{request.requester?.name || 'Unknown'}</p>
                      <p className="text-xs font-semibold text-[#6b7a99]">{request.requester?.email || ''}</p>
                    </div>

                    {request.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => review(request.id, 'APPROVED')}
                          disabled={isReviewing}
                          className="flex-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-50 text-xs font-bold text-emerald-700 transition hover:border-emerald-500/40 hover:bg-emerald-100 disabled:opacity-60"
                        >
                          {isReviewing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          Approve
                        </button>
                        <button
                          onClick={() => review(request.id, 'REJECTED')}
                          disabled={isReviewing}
                          className="flex-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-50 text-xs font-bold text-red-700 transition hover:border-red-500/40 hover:bg-red-100 disabled:opacity-60"
                        >
                          <X size={14} />
                          Reject
                        </button>
                      </div>
                    )}
                    
                    {/* Bottom action buttons */}
                    <div className="mt-3 flex items-center justify-end gap-2 border-t border-[#e6ebf4] pt-3">
                      <button
                        onClick={() => setViewingRequest(request)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-blue-500/15 bg-blue-50 px-3 text-xs font-bold text-blue-600 transition hover:bg-blue-100"
                      >
                        <Eye size={13} />
                        View
                      </button>
                      <button
                        onClick={() => deleteRequest(request.id)}
                        disabled={isDeleting}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-500/15 bg-red-50 px-3 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#120a33]/65 p-4 backdrop-blur-md"
            onClick={(e) => e.target === e.currentTarget && setViewingRequest(null)}
          >
            <div className="relative w-full max-w-[480px] overflow-hidden rounded-xl border border-white/70 bg-white/90 shadow-[0_28px_80px_rgba(65,103,153,0.26)] backdrop-blur-xl">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#2f80ed] via-[#58d68d] to-[#ffb84d]" />
              
              <div className="relative flex items-center justify-between border-b border-[#d8e6f8] px-5 py-5 sm:px-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2f80ed]">Mess Request</p>
                  <h2 className="mt-1 text-xl font-black text-[#172554] truncate">{viewingRequest.mess_name}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingRequest(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8e6f8] bg-[#e7f1ff] text-[#2f80ed] transition hover:border-[#a9ccfb] hover:bg-[#dcebff]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="relative max-h-[calc(100vh-120px)] overflow-y-auto p-5 sm:p-6">
                {/* Status badge */}
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#6b7a99]">Status</span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${STATUS_CONFIG[viewingRequest.status].bg} ${STATUS_CONFIG[viewingRequest.status].text} ${STATUS_CONFIG[viewingRequest.status].border}`}>
                    {STATUS_CONFIG[viewingRequest.status].icon}
                    {STATUS_CONFIG[viewingRequest.status].label}
                  </span>
                </div>
                
                {/* Basic info */}
                <div className="mb-4 space-y-3">
                  <div className="rounded-lg border border-[#e6ebf4] bg-[#f8faff] p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#6b7a99]">Mess Name</p>
                    <p className="mt-1 text-sm font-bold text-[#172554]">{viewingRequest.mess_name}</p>
                  </div>
                  {viewingRequest.address && (
                    <div className="rounded-lg border border-[#e6ebf4] bg-[#f8faff] p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#6b7a99]">Address</p>
                      <p className="mt-1 text-sm font-bold text-[#172554]">{viewingRequest.address}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-[#e6ebf4] bg-[#f8faff] p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#6b7a99]">Total Seats</p>
                      <p className="mt-1 text-sm font-bold text-[#172554]">{viewingRequest.total_seats ?? '-'}</p>
                    </div>
                    <div className="rounded-lg border border-[#e6ebf4] bg-[#f8faff] p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#6b7a99]">Monthly Rent</p>
                      <p className="mt-1 text-sm font-bold text-[#172554]">৳ {Number(viewingRequest.monthly_rent ?? 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Requester info */}
                <div className="mb-4 rounded-lg border border-[#e6ebf4] p-3">
                  <p className="mb-2 text-xs font-bold text-[#6b7a99]">Requested By</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2f80ed]/10 to-[#8b5cf6]/10 text-sm font-black text-[#2f80ed]">
                      {viewingRequest.requester?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#172554]">{viewingRequest.requester?.name || 'Unknown'}</p>
                      <p className="text-xs font-semibold text-[#6b7a99]">{viewingRequest.requester?.email || ''}</p>
                      {viewingRequest.requester?.phone && (
                        <p className="text-xs font-semibold text-[#6b7a99]">{viewingRequest.requester.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Created at */}
                {viewingRequest.created_at && (
                  <div className="rounded-lg border border-[#e6ebf4] bg-[#f8faff] p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#6b7a99]">Submitted</p>
                    <p className="mt-1 text-sm font-bold text-[#172554]">{formatDate(viewingRequest.created_at)}</p>
                  </div>
                )}

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setViewingRequest(null)}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-6 font-black text-white shadow-[0_12px_28px_rgba(47,128,237,0.25)] transition hover:shadow-[0_16px_35px_rgba(47,128,237,0.32)]"
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
