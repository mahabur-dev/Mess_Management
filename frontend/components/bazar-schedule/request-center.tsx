'use client'

import { ArrowLeftRight, CalendarDays, Check, Clock3, Inbox, RotateCcw, X } from 'lucide-react'
import type { BazarReleaseRequest, BazarSwapRequest } from '@/lib/api-client'
import { EnterpriseButton } from '@/components/ui/enterprise-button'
import { cn } from '@/lib/utils'
import { formatBazarDate, requestTone } from './bazar-schedule-utils'

interface RequestCenterProps {
  swaps: BazarSwapRequest[]
  releases: BazarReleaseRequest[]
  userId?: string
  canManage: boolean
  busyId?: string | null
  onSwapReview: (request: BazarSwapRequest, approve: boolean) => void
  onSwapCancel: (request: BazarSwapRequest) => void
  onReleaseReview: (request: BazarReleaseRequest, approve: boolean) => void
}

export function RequestCenter({ swaps, releases, userId, canManage, busyId, onSwapReview, onSwapCancel, onReleaseReview }: RequestCenterProps) {
  const sorted = [
    ...swaps.map((request) => ({ kind: 'swap' as const, request, createdAt: request.created_at })),
    ...releases.map((request) => ({ kind: 'release' as const, request, createdAt: request.created_at })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  if (!sorted.length) {
    return (
      <div className="dashboard-card flex min-h-72 flex-col items-center justify-center p-8 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]"><Inbox className="size-6" /></span>
        <h3 className="mt-4 text-lg font-semibold text-[var(--dashboard-ink)]">No requests yet</h3>
        <p className="mt-1 max-w-sm text-sm font-medium leading-6 text-muted-foreground">Swap and release activity will appear here with a complete decision history.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sorted.map((item) => item.kind === 'swap' ? (
        <SwapCard key={`swap-${item.request.id}`} request={item.request} userId={userId} busy={busyId === item.request.id} onReview={onSwapReview} onCancel={onSwapCancel} />
      ) : (
        <ReleaseCard key={`release-${item.request.id}`} request={item.request} canManage={canManage} busy={busyId === item.request.id} onReview={onReleaseReview} />
      ))}
    </div>
  )
}

function SwapCard({ request, userId, busy, onReview, onCancel }: { request: BazarSwapRequest; userId?: string; busy: boolean; onReview: (request: BazarSwapRequest, approve: boolean) => void; onCancel: (request: BazarSwapRequest) => void }) {
  const isTarget = request.target_member_id === userId
  const isRequester = request.requester_id === userId
  return (
    <article className="dashboard-card overflow-hidden p-4 sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]"><ArrowLeftRight className="size-5" /></span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-[var(--dashboard-ink)]">Duty swap</h3><StatusBadge status={request.status} /></div>
            <p className="mt-1 text-sm font-medium text-muted-foreground"><span className="font-semibold text-[var(--dashboard-ink)]">{request.requester.name}</span> requested a swap with <span className="font-semibold text-[var(--dashboard-ink)]">{request.target_member.name}</span></p>
            {request.reason && <p className="mt-2 text-xs font-medium italic text-muted-foreground">“{request.reason}”</p>}
          </div>
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl bg-[var(--dashboard-surface-subtle)] p-3">
          <DateChip label={request.requester.name} date={request.requester_slot.bazar_date.duty_date} />
          <ArrowLeftRight className="size-4 text-[var(--brand)]" />
          <DateChip label={request.target_member.name} date={request.target_slot.bazar_date.duty_date} align="right" />
        </div>
        {request.status === 'PENDING' && isTarget && (
          <div className="flex shrink-0 gap-2">
            <EnterpriseButton size="sm" tone="secondary" onClick={() => onReview(request, false)} disabled={busy}><X className="size-3.5" /> Decline</EnterpriseButton>
            <EnterpriseButton size="sm" tone="success" onClick={() => onReview(request, true)} disabled={busy}><Check className="size-3.5" /> Accept</EnterpriseButton>
          </div>
        )}
        {request.status === 'PENDING' && isRequester && (
          <EnterpriseButton size="sm" tone="secondary" className="shrink-0" onClick={() => onCancel(request)} disabled={busy}><RotateCcw className="size-3.5" /> Cancel</EnterpriseButton>
        )}
      </div>
    </article>
  )
}

function ReleaseCard({ request, canManage, busy, onReview }: { request: BazarReleaseRequest; canManage: boolean; busy: boolean; onReview: (request: BazarReleaseRequest, approve: boolean) => void }) {
  return (
    <article className="dashboard-card overflow-hidden p-4 sm:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"><Clock3 className="size-5" /></span>
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-[var(--dashboard-ink)]">Duty release</h3><StatusBadge status={request.status} />{request.auto_approved && <span className="rounded-full bg-[var(--brand-soft)] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[var(--brand-dark)]">Automatic</span>}</div><p className="mt-1 text-sm font-medium text-muted-foreground"><span className="font-semibold text-[var(--dashboard-ink)]">{request.requester.name}</span> · {formatBazarDate(request.slot.bazar_date.duty_date)}</p><p className="mt-2 text-xs font-medium italic text-muted-foreground">“{request.reason}”</p></div>
        </div>
        {request.status === 'PENDING' && canManage && (
          <div className="flex shrink-0 gap-2">
            <EnterpriseButton size="sm" tone="danger" onClick={() => onReview(request, false)} disabled={busy}><X className="size-3.5" /> Reject</EnterpriseButton>
            <EnterpriseButton size="sm" tone="success" onClick={() => onReview(request, true)} disabled={busy}><Check className="size-3.5" /> Approve</EnterpriseButton>
          </div>
        )}
      </div>
    </article>
  )
}

function StatusBadge({ status }: { status: BazarSwapRequest['status'] }) {
  return <span className={cn('rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em]', requestTone(status))}>{status}</span>
}

function DateChip({ label, date, align = 'left' }: { label: string; date: string; align?: 'left' | 'right' }) {
  return (
    <div className={cn('min-w-0', align === 'right' && 'text-right')}>
      <p className="truncate text-[10px] font-semibold text-muted-foreground">{label}</p>
      <p className={cn('mt-1 flex items-center gap-1.5 text-xs font-bold text-[var(--dashboard-ink)]', align === 'right' && 'justify-end')}><CalendarDays className="size-3.5 text-[var(--brand)]" />{formatBazarDate(date, { month: 'short', day: 'numeric' })}</p>
    </div>
  )
}
