'use client'

import { useEffect, useMemo, useState } from 'react'
import { Building2, Loader2, MapPin, Send, X } from 'lucide-react'
import { apiClient, ApiError, type Mess } from '@/lib/api-client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type MemberJoinRequestModalProps = {
  open: boolean
  onClose: () => void
  onSubmitted?: () => void
  hasPendingRequest?: boolean
}

export function MemberJoinRequestModal({ open, onClose, onSubmitted, hasPendingRequest = false }: MemberJoinRequestModalProps) {
  const [messes, setMesses] = useState<Mess[]>([])
  const [selectedMessId, setSelectedMessId] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const selectedMess = useMemo(
    () => messes.find((mess) => mess.id === selectedMessId) ?? null,
    [messes, selectedMessId],
  )

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setLoading(true)
    setError('')

    apiClient
      .getActiveMesses({ limit: 100 })
      .then((response) => {
        if (cancelled) return
        const list = Array.isArray(response.data) ? response.data : []
        setMesses(list)
        setSelectedMessId((current) => current || list[0]?.id || '')
      })
      .catch((error) => {
        if (!cancelled) {
          setError(error instanceof ApiError ? error.message : 'Failed to load messes')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open])

  if (!open) return null

  async function submit() {
    if (hasPendingRequest) return
    if (!selectedMessId) {
      setError('Please select a mess')
      return
    }

    setError('')
    setSubmitting(true)

    try {
      await apiClient.requestMemberJoin(selectedMessId)
      onSubmitted?.()
      onClose()
    } catch (error) {
      setError(error instanceof ApiError ? error.message : 'Failed to send request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#120a33]/65 p-4 backdrop-blur-md"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-[500px] overflow-hidden rounded-xl border border-white/70 bg-white/95 shadow-[0_28px_80px_rgba(65,103,153,0.26)] backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#2f80ed] via-[#58d68d] to-[#ffb84d]" />

        <div className="relative flex items-center justify-between border-b border-[#d8e6f8] px-5 py-5 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2f80ed]">Member Request</p>
            <h2 className="mt-1 text-xl font-semibold text-[#172554]">Request Member Access</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8e6f8] bg-[#e7f1ff] text-[#2f80ed] transition hover:border-[#a9ccfb] hover:bg-[#dcebff]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative p-5 sm:p-6">
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b7a99]">
            Select Mess
          </label>
          <Select value={selectedMessId} onValueChange={setSelectedMessId} disabled={loading || messes.length === 0}>
            <SelectTrigger className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-bold text-[#172554] shadow-none outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10">
              <SelectValue placeholder={loading ? 'Loading messes...' : 'Select an active mess'} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-[#d8e6f8] bg-white shadow-[0_20px_45px_rgba(65,103,153,0.18)]">
              {messes.map((mess) => (
                <SelectItem
                  key={mess.id}
                  value={mess.id}
                  className="rounded-lg px-3 py-2 text-sm font-bold text-[#172554] focus:bg-[#edf5ff] focus:text-[#2f80ed]"
                >
                  {mess.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedMess && (
            <div className="mt-4 rounded-xl border border-[#e6ebf4] bg-[#f8faff] p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e7f1ff] text-[#2f80ed]">
                  <Building2 size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#172554]">{selectedMess.name}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#6b7a99]">
                    <MapPin size={12} className="shrink-0 text-[#ffb84d]" />
                    <span className="truncate">{selectedMess.address || 'No address set'}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {!loading && messes.length === 0 && (
            <div className="mt-4 rounded-xl border border-amber-200/70 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
              No active messes are available.
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-200/70 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {error}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.5fr]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-12 rounded-xl border border-[#d8e6f8] bg-white px-4 font-semibold text-[#53617d] transition hover:bg-[#edf5ff] disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={loading || submitting || hasPendingRequest || !selectedMessId}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-4 font-semibold text-white shadow-[0_16px_35px_rgba(47,128,237,0.30)] transition hover:shadow-[0_20px_42px_rgba(47,128,237,0.38)] disabled:opacity-70"
            >
              {submitting || loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {hasPendingRequest ? 'Request Pending' : submitting ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
