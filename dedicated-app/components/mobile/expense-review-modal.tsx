'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, CalendarDays, CheckCircle2, FileText, UserRound, X, XCircle } from 'lucide-react'
import { categoryLabel, formatDate, formatTaka } from '@/components/mobile/expense-design'

export type ExpenseReviewAction = 'APPROVED' | 'REJECTED'

type ExpenseReviewModalProps = {
  action: ExpenseReviewAction
  amount?: string | number | null
  category?: string | null
  itemName?: string | null
  expenseDate?: string | null
  addedBy?: string | null
  purchasedBy?: string | null
  busy?: boolean
  error?: string
  onClose: () => void
  onConfirm: (note: string) => void
}

export function ExpenseReviewModal({
  action,
  amount,
  category,
  itemName,
  expenseDate,
  addedBy,
  purchasedBy,
  busy = false,
  error,
  onClose,
  onConfirm,
}: ExpenseReviewModalProps) {
  const [note, setNote] = useState('')
  const isApprove = action === 'APPROVED'
  const utilityCategories = new Set(['UTILITY', 'ELECTRICITY', 'WATER', 'GAS', 'WIFI', 'CLEANER', 'BUABILL', 'MAINTENANCE'])
  const recordLabel = utilityCategories.has(String(category ?? '').toUpperCase()) ? 'utility' : 'expense'
  const displayName = itemName?.trim() || categoryLabel(category)
  const actionTitle = isApprove ? `Approve ${recordLabel}` : `Reject ${recordLabel}`
  const actionLabel = isApprove ? 'Approve' : 'Reject'

  useEffect(() => {
    setNote('')
  }, [action])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [busy, onClose])

  return (
    <div
      className="app-modal-backdrop p-3 sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && !busy) onClose()
      }}
    >
      <section
        className="app-modal app-modal--review"
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-review-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start gap-3 border-b border-[#e9eff1] px-5 pb-4 pt-5">
          <span
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-[14px] ${isApprove ? 'bg-[#e5f7f4] text-[#008d8c]' : 'bg-[#fff1f1] text-[#d92d20]'}`}
            aria-hidden="true"
          >
            {isApprove ? <CheckCircle2 size={23} strokeWidth={2.2} /> : <XCircle size={23} strokeWidth={2.2} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-caption font-bold uppercase tracking-[0.12em] text-[#65838b]">Manager review</p>
            <h2 id="expense-review-title" className="mt-1 text-[19px] font-bold leading-tight text-[#123748]">
              {actionTitle}?
            </h2>
            <p className="mt-1 text-label text-[#65838b]">
              {isApprove ? 'Confirm this record before it is included in mess accounting.' : 'Confirm the rejection and leave context for the submitter.'}
            </p>
          </div>
          <button type="button" className="app-modal-close shrink-0" onClick={onClose} disabled={busy} aria-label="Close review dialog" title="Close">
            <X size={18} strokeWidth={2.4} />
          </button>
        </header>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (!busy) onConfirm(note.trim())
          }}
        >
          <div className="space-y-4 px-5 py-5">
            <div className="rounded-[16px] border border-[#dcebed] bg-[#f7fbfb] p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-caption font-semibold text-[#65838b]">Record</p>
                  <p className="mt-1 truncate text-label font-bold text-[#123748]">{displayName}</p>
                </div>
                <p className="shrink-0 text-body font-bold text-[#008d8c]">{formatTaka(amount)}</p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[#e2eeee] pt-3">
                <div className="flex min-w-0 items-center gap-2">
                  <CalendarDays size={15} className="shrink-0 text-[#008d8c]" aria-hidden="true" />
                  <span className="min-w-0 truncate text-caption font-medium text-[#65838b]">{formatDate(expenseDate)}</span>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <UserRound size={15} className="shrink-0 text-[#008d8c]" aria-hidden="true" />
                  <span className="min-w-0 truncate text-caption font-medium text-[#65838b]">{addedBy || purchasedBy || 'Unknown member'}</span>
                </div>
              </div>
            </div>

            <div className={`flex gap-3 rounded-[14px] border px-3.5 py-3 ${isApprove ? 'border-[#bfe7e6] bg-[#edfafa]' : 'border-[#f7d1ce] bg-[#fff8f7]'}`}>
              {isApprove ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#008d8c]" aria-hidden="true" /> : <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[#d92d20]" aria-hidden="true" />}
              <p className={`text-caption font-semibold leading-relaxed ${isApprove ? 'text-[#006d70]' : 'text-[#9d2b22]'}`}>
                {isApprove ? 'Approving will make this record eligible for the mess billing and balance calculations.' : 'Rejecting keeps this record outside the approved accounts until it is submitted again.'}
              </p>
            </div>

            <label className="block">
              <span className="mb-2 flex items-center justify-between gap-3 text-label font-bold text-[#1d3a42]">
                <span className="flex items-center gap-2"><FileText size={16} className="text-[#008d8c]" aria-hidden="true" /> Review note</span>
                <span className="text-caption font-medium text-[#8a98ad]">Optional</span>
              </span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value.slice(0, 500))}
                rows={3}
                maxLength={500}
                disabled={busy}
                placeholder={isApprove ? 'Add a short internal note if needed...' : 'Explain the reason for rejection...'}
                className="min-h-[88px] w-full resize-y rounded-[14px] border border-[#d6e5e8] bg-white px-3.5 py-3 text-label font-medium text-[#1d3a42] outline-none transition placeholder:text-[#9aaab2] focus:border-[#008d8c] focus:ring-4 focus:ring-[#008d8c]/10 disabled:bg-[#f5f7f8]"
              />
              <span className="mt-1 block text-right text-caption font-medium text-[#8a98ad]">{note.length}/500</span>
            </label>

            {error ? <div className="ui-notice ui-notice--danger" role="alert">{error}</div> : null}
          </div>

          <footer className="grid grid-cols-2 gap-3 border-t border-[#e9eff1] bg-[#fbfcfc] px-5 py-4">
            <button type="button" className="app-modal-secondary px-3 text-label" onClick={onClose} disabled={busy}>Cancel</button>
            <button type="submit" className={`app-modal-primary inline-flex items-center justify-center gap-2 whitespace-nowrap px-3 text-label ${!isApprove ? '!bg-[#d92d20] !shadow-[0_12px_24px_rgba(217,45,32,0.16)]' : ''}`} disabled={busy}>
              {isApprove ? <CheckCircle2 size={17} strokeWidth={2.5} aria-hidden="true" /> : <XCircle size={17} strokeWidth={2.5} aria-hidden="true" />}
              {busy ? 'Saving...' : actionLabel}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
