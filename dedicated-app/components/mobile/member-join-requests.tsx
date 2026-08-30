'use client'

import { Check, Clock3, Mail, UserRoundPlus, X } from 'lucide-react'
import { LoadingIndicator } from '@/components/loading-indicator'
import { useLocaleFormatters, useTranslations } from '@/lib/i18n'
import type { MemberJoinRequest, MemberJoinReviewStatus } from '@/lib/member-join-requests'

type ReviewInProgress = {
  requestId: string
  status: MemberJoinReviewStatus
} | null

type Feedback = {
  tone: 'success' | 'error'
  text: string
} | null

function requesterInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'M'
}

export function MemberJoinRequestCard({
  request,
  reviewInProgress,
  onReview,
}: {
  request: MemberJoinRequest
  reviewInProgress: ReviewInProgress
  onReview: (request: MemberJoinRequest, status: MemberJoinReviewStatus) => void
}) {
  const t = useTranslations('members')
  const format = useLocaleFormatters()
  const isBusy = reviewInProgress?.requestId === request.id
  const reviewLocked = reviewInProgress !== null

  return (
    <article className="app-list-row py-4">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#e6f7f6] text-label font-semibold text-[#008d8c]" aria-hidden="true">
          {requesterInitials(request.requester.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body font-semibold text-[#1d3a42]">{request.requester.name}</span>
          <span className="mt-0.5 flex items-center gap-1.5 truncate text-caption font-medium text-[#65838b]">
            <Mail size={13} className="shrink-0" />
            <span className="truncate">{request.requester.email}</span>
          </span>
        </span>
        <span className="shrink-0 rounded-full bg-[#fff7e6] px-2.5 py-1 text-caption font-bold text-[#a15c00]">{t('pending')}</span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#edf1f4] pt-3">
        <span className="min-w-0">
          <span className="block truncate text-label font-bold text-[#123748]">{request.mess.name}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-caption font-medium text-[#65838b]">
            <Clock3 size={13} /> {request.created_at ? format.date(request.created_at, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : t('recentlyRequested')}
          </span>
        </span>
        <UserRoundPlus size={20} className="shrink-0 text-[#70bdbc]" aria-hidden="true" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={reviewLocked}
          onClick={() => onReview(request, 'REJECTED')}
          className="flex min-h-10 items-center justify-center gap-1.5 rounded-[10px] border border-[#efcaca] bg-white px-3 text-label font-bold text-[#b42318] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={t('rejectNamedRequest', { name: request.requester.name })}
        >
          {isBusy && reviewInProgress?.status === 'REJECTED' ? <LoadingIndicator size="sm" label={t('rejectingRequest')} /> : <><X size={16} /> {t('reject')}</>}
        </button>
        <button
          type="button"
          disabled={reviewLocked}
          onClick={() => onReview(request, 'APPROVED')}
          className="flex min-h-10 items-center justify-center gap-1.5 rounded-[10px] border border-[#008d8c] bg-[#008d8c] px-3 text-label font-bold text-white shadow-[0_8px_18px_rgba(0,119,122,0.16)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={t('approveNamedRequest', { name: request.requester.name })}
        >
          {isBusy && reviewInProgress?.status === 'APPROVED' ? <LoadingIndicator size="sm" label={t('approvingRequest')} className="!text-white" /> : <><Check size={16} /> {t('approve')}</>}
        </button>
      </div>
    </article>
  )
}

export function MemberJoinRequestsPanel({
  requests,
  loading,
  feedback,
  reviewInProgress,
  onReview,
}: {
  requests: MemberJoinRequest[]
  loading: boolean
  feedback: Feedback
  reviewInProgress: ReviewInProgress
  onReview: (request: MemberJoinRequest, status: MemberJoinReviewStatus) => void
}) {
  const t = useTranslations('members')
  const format = useLocaleFormatters()
  return (
    <section className="app-section" aria-labelledby="join-requests-title">
      <div className="flex items-center justify-between gap-3 px-1 pb-3">
        <div>
          <h2 id="join-requests-title" className="text-body font-semibold text-[#1d3a42]">{t('joinRequests')}</h2>
          <p className="mt-0.5 text-caption font-medium text-[#65838b]">{t('reviewWaitingMembers')}</p>
        </div>
        <span className="grid min-w-8 place-items-center rounded-full bg-[#e6f7f6] px-2.5 py-1.5 text-label font-semibold text-[#008d8c]" aria-label={t('pendingRequestCount', { count: requests.length })}>
          {format.number(requests.length)}
        </span>
      </div>

      {feedback ? (
        <div className={`mb-3 rounded-[10px] border px-3 py-2.5 text-label font-semibold ${feedback.tone === 'error' ? 'border-[#efcaca] bg-[#fff5f5] text-[#b42318]' : 'border-[#bfe7e6] bg-[#edfafa] text-[#00777a]'}`}>
          {feedback.text}
        </div>
      ) : null}

      <div className="app-list">
        {loading ? <LoadingIndicator variant="card" label={t('loadingJoinRequests')} /> : null}
        {!loading ? requests.map((request) => <MemberJoinRequestCard key={request.id} request={request} reviewInProgress={reviewInProgress} onReview={onReview} />) : null}
        {!loading && !requests.length ? (
          <div className="app-empty-state">
            {t('noPendingJoinRequests')}
          </div>
        ) : null}
      </div>
    </section>
  )
}
