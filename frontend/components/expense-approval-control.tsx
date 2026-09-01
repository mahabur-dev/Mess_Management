'use client'

import { CheckCircle2, Clock3, Loader2, XCircle } from 'lucide-react'

import { EnterpriseSelect } from '@/components/ui/enterprise-select'
import type { ExpenseApprovalStatus } from '@/lib/api-client'
import { cn } from '@/lib/utils'

const approvalOptions = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
] satisfies Array<{ value: ExpenseApprovalStatus; label: string }>

const approvalPresentation = {
  PENDING: {
    label: 'Pending',
    icon: Clock3,
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  APPROVED: {
    label: 'Approved',
    icon: CheckCircle2,
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  REJECTED: {
    label: 'Rejected',
    icon: XCircle,
    className: 'border-rose-200 bg-rose-50 text-rose-700',
  },
} satisfies Record<ExpenseApprovalStatus, { label: string; icon: typeof Clock3; className: string }>

interface ExpenseApprovalControlProps {
  status: ExpenseApprovalStatus
  canReview?: boolean
  updating?: boolean
  className?: string
  onStatusChange?: (status: Exclude<ExpenseApprovalStatus, 'PENDING'>) => void
}

/**
 * Shared approval control for expense lists and detail surfaces. A pending
 * expense can be reviewed once; finalized expenses remain read-only.
 */
export function ExpenseApprovalControl({
  status,
  canReview = false,
  updating = false,
  className,
  onStatusChange,
}: ExpenseApprovalControlProps) {
  const presentation = approvalPresentation[status]
  const Icon = presentation.icon
  const isReviewable = canReview && status === 'PENDING'

  if (!canReview) {
    return (
      <span
        className={cn(
          'inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold',
          presentation.className,
          className,
        )}
      >
        <Icon size={13} aria-hidden="true" />
        {presentation.label}
      </span>
    )
  }

  return (
    <div className={cn('relative min-w-[128px]', className)}>
      <EnterpriseSelect
        value={status}
        disabled={!isReviewable || updating}
        onValueChange={(value) => {
          if (!isReviewable || value === 'PENDING') return
          onStatusChange?.(value as Exclude<ExpenseApprovalStatus, 'PENDING'>)
        }}
        options={approvalOptions}
        className={cn(
          'h-9 min-h-9 rounded-lg px-3 text-xs font-bold shadow-none disabled:cursor-default disabled:opacity-100',
          presentation.className,
          updating && 'pr-8',
        )}
        contentClassName="min-w-[140px]"
      />
      {updating && (
        <Loader2
          size={14}
          className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 animate-spin"
          aria-label="Updating expense status"
        />
      )}
    </div>
  )
}
