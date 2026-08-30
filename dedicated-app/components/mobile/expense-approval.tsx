'use client'

import { Check, X } from 'lucide-react'
import { paymentStatusLabel, useLocale, useTranslations } from '@/lib/i18n'

export type ExpenseApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export function normalizeExpenseApprovalStatus(
  approvalStatus?: string | null,
  recordStatus?: string | null,
): ExpenseApprovalStatus | null {
  const value = String(approvalStatus || recordStatus || '').toUpperCase()
  if (value === 'PENDING' || value === 'DRAFT') return 'PENDING'
  if (value === 'REJECTED' || value === 'CANCELLED') return 'REJECTED'
  if (value === 'APPROVED' || value === 'CONFIRMED') return 'APPROVED'
  return null
}

export function ExpenseApprovalBadge({
  status,
  recordStatus,
}: {
  status?: string | null
  recordStatus?: string | null
}) {
  const { locale } = useLocale()
  const normalized = normalizeExpenseApprovalStatus(status, recordStatus)
  if (!normalized) return null

  const tone = {
    PENDING: 'ui-badge--warning',
    APPROVED: 'ui-badge--success',
    REJECTED: 'ui-badge--danger',
  }[normalized]

  return <span className={`ui-badge ${tone}`}>{paymentStatusLabel(normalized, locale)}</span>
}

export function ExpenseReviewActions({
  busy,
  onApprove,
  onReject,
}: {
  busy?: boolean
  onApprove: () => void
  onReject: () => void
}) {
  const t = useTranslations('expenses')
  return (
    <div className="grid grid-cols-2 gap-3">
      <button type="button" className="ui-btn ui-btn--primary px-3" disabled={busy} onClick={onApprove}>
        <Check size={17} strokeWidth={2.6} aria-hidden="true" />
        {busy ? t('reviewing') : t('approve')}
      </button>
      <button type="button" className="ui-btn ui-btn--danger px-3" disabled={busy} onClick={onReject}>
        <X size={17} strokeWidth={2.6} aria-hidden="true" />
        {t('reject')}
      </button>
    </div>
  )
}
