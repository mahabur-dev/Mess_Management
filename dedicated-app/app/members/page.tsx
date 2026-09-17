'use client'

import { Search, UserPlus, UserRoundPlus, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { FloatingActionLink } from '@/components/mobile/floating-action-link'
import { IconInput } from '@/components/mobile/icon-input'
import { MemberCard, type MobileMember } from '@/components/mobile/member-card'
import { MemberJoinRequestsPanel } from '@/components/mobile/member-join-requests'
import { MessOnboardingActions } from '@/components/mess-onboarding-actions'
import { MobileShell } from '@/components/mobile-shell'
import { LoadingIndicator } from '@/components/loading-indicator'
import { TopScreen } from '@/components/top-screen'
import { api } from '@/lib/api'
import { canManageMess, getActiveMessId } from '@/lib/app-permissions'
import { useAutoDismiss } from '@/hooks/use-auto-dismiss'
import type { MemberJoinRequest, MemberJoinReviewStatus } from '@/lib/member-join-requests'
import { useLocaleFormatters, useLocalizedNotice, useTranslations } from '@/lib/i18n'
import { useAuth } from '../providers'

type MemberView = 'members' | 'requests'

export default function MembersPage() {
  const format = useLocaleFormatters()
  const t = useTranslations('members')
  const memberNotice = useLocalizedNotice('members')
  const joinNotice = useLocalizedNotice('members')
  const { user } = useAuth()
  const messId = useMemo(() => getActiveMessId(user), [user])
  const canReviewRequests = canManageMess(user)
  const [members, setMembers] = useState<MobileMember[]>([])
  const [joinRequests, setJoinRequests] = useState<MemberJoinRequest[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeView, setActiveView] = useState<MemberView>('members')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [joinRequestsLoading, setJoinRequestsLoading] = useState(false)
  const [reviewInProgress, setReviewInProgress] = useState<{ requestId: string; status: MemberJoinReviewStatus } | null>(null)

  useAutoDismiss(memberNotice.notice?.message ?? '', memberNotice.clearNotice)
  useAutoDismiss(joinNotice.notice?.message ?? '', joinNotice.clearNotice)

  const joinRequestFeedback = joinNotice.notice
    ? { tone: joinNotice.notice.tone === 'danger' ? 'error' as const : 'success' as const, text: joinNotice.notice.message }
    : null

  async function loadMembers() {
    if (!messId) return
    setLoading(true)
    memberNotice.clearNotice()
    try {
      const res = await api.getAllMembers({ limit: 500, searchTerm: search.trim() || undefined })
      const list = Array.isArray(res.data) ? res.data : []
      setMembers(list.filter((item: MobileMember) => item.is_active !== false && (item.mess_id === messId || item.mess?.id === messId)))
    } catch (error) {
      setMembers([])
      memberNotice.showError(error, 'loadMembersFailed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let alive = true
    if (!messId) return

    setLoading(true)
    memberNotice.clearNotice()
    api
      .getAllMembers({ limit: 500, searchTerm: search.trim() || undefined })
      .then((res) => {
        if (!alive) return
        const list = Array.isArray(res.data) ? res.data : []
        setMembers(list.filter((item: MobileMember) => item.is_active !== false && (item.mess_id === messId || item.mess?.id === messId)))
      })
      .catch((error) => {
        if (!alive) return
        setMembers([])
        memberNotice.showError(error, 'loadMembersFailed')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [messId, search])

  useEffect(() => {
    if (!messId || !canReviewRequests) return
    let alive = true

    setJoinRequestsLoading(true)
    joinNotice.clearNotice()
    api
      .getManagedMemberJoinRequests({ status: 'PENDING', limit: 50, sortBy: 'created_at', sortOrder: 'desc' })
      .then((response) => {
        if (!alive) return
        const requests = Array.isArray(response.data) ? response.data : []
        setJoinRequests(requests.filter((request) => request.mess_id === messId || request.mess?.id === messId))
      })
      .catch((error) => {
        if (!alive) return
        setJoinRequests([])
        joinNotice.showError(error, 'loadJoinRequestsFailed')
      })
      .finally(() => {
        if (alive) setJoinRequestsLoading(false)
      })

    return () => {
      alive = false
    }
  }, [canReviewRequests, messId])

  const filteredMembers = useMemo(() => {
    const term = search.trim().toLowerCase()
    return members.filter((member) => {
      const text = `${member.user?.name ?? ''} ${member.user?.email ?? ''} ${member.user?.phone ?? ''} ${member.room_no ?? ''}`.toLowerCase()
      return !term || text.includes(term)
    })
  }, [members, search])

  const filteredJoinRequests = useMemo(() => {
    const term = search.trim().toLowerCase()
    return joinRequests.filter((request) => {
      const text = `${request.requester.name ?? ''} ${request.requester.email ?? ''} ${request.mess?.name ?? ''}`.toLowerCase()
      return !term || text.includes(term)
    })
  }, [joinRequests, search])

  async function deleteMember(member: MobileMember) {
    setOpenMenuId(null)
    if (!window.confirm(t('deleteMemberConfirm', { name: member.user?.name ?? t('thisMember') }))) return

    setDeletingId(member.id)
    memberNotice.clearNotice()
    try {
      await api.removeMember(member.mess_id, member.user_id)
      setMembers((current) => current.filter((item) => item.id !== member.id))
      memberNotice.showMessage('memberDeleted', 'success')
      await loadMembers()
    } catch (error) {
      memberNotice.showError(error, 'deleteMemberFailed')
    } finally {
      setDeletingId(null)
    }
  }

  async function reviewJoinRequest(request: MemberJoinRequest, status: MemberJoinReviewStatus) {
    if (reviewInProgress) return

    setReviewInProgress({ requestId: request.id, status })
    joinNotice.clearNotice()
    try {
      await api.reviewMemberJoinRequest(request.id, status)
      setJoinRequests((current) => current.filter((item) => item.id !== request.id))
      joinNotice.showMessage(status === 'APPROVED' ? 'joinRequestApproved' : 'joinRequestRejected', 'success', { name: request.requester.name })
      if (status === 'APPROVED') await loadMembers()
    } catch (error) {
      joinNotice.showError(error, 'reviewJoinRequestFailed')
    } finally {
      setReviewInProgress(null)
    }
  }

  return (
    <MobileShell hasFloatingAction={Boolean(messId)}>
      <TopScreen title={t('title')} subtitle={t('allMembersSubtitle')} backHref="/" />
      <div className="screen space-y-3">
        {!messId ? <MessOnboardingActions compact /> : null}

        {messId ? (
          <>
        <section className="app-toolbar">
          <IconInput
            icon={Search}
            placeholder={activeView === 'members' ? t('searchMember') : t('searchJoinRequest')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-12 rounded-[15px] border-[#bfe7e6] bg-[#fbffff] py-3 text-label font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]"
          />
        </section>

        <section className="app-section py-0!">
          <div className="app-tabs grid grid-cols-2 gap-1.5" role="tablist" aria-label={t('memberView')}>
            <button
              type="button"
              role="tab"
              aria-selected={activeView === 'members'}
              onClick={() => setActiveView('members')}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-[14px] px-3 text-label font-semibold transition active:scale-[0.98] ${
                activeView === 'members'
                  ? 'bg-white text-[#00777a] shadow-[0_8px_18px_rgba(0,119,122,0.12)]'
                  : 'text-[#65838b]'
              }`}
            >
              <Users size={16} />
              {t('member')}
              <span className={`rounded-full px-2 py-0.5 text-caption font-semibold ${activeView === 'members' ? 'bg-[#edfafa] text-[#008d8c]' : 'bg-white/70 text-[#65838b]'}`}>
                {format.number(filteredMembers.length)}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeView === 'requests'}
              onClick={() => setActiveView('requests')}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-[14px] px-3 text-label font-semibold transition active:scale-[0.98] ${
                activeView === 'requests'
                  ? 'bg-white text-[#00777a] shadow-[0_8px_18px_rgba(0,119,122,0.12)]'
                  : 'text-[#65838b]'
              }`}
            >
              <UserRoundPlus size={16} />
              {t('joinRequest')}
              <span className={`rounded-full px-2 py-0.5 text-caption font-semibold ${activeView === 'requests' ? 'bg-[#edfafa] text-[#008d8c]' : 'bg-white/70 text-[#65838b]'}`}>
                {format.number(filteredJoinRequests.length)}
              </span>
            </button>
          </div>
        </section>

        {memberNotice.notice ? <div className={`ui-notice ui-notice--${memberNotice.notice.tone}`} role="status">{memberNotice.notice.message}</div> : null}

        {activeView === 'members' ? (
          <section className="flush-list member-list">
            {loading ? (
              <LoadingIndicator variant="card" label={t('loadingMembers')} />
            ) : (
              filteredMembers.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  variant="horizontal"
                  menuOpen={openMenuId === member.id}
                  deleting={deletingId === member.id}
                  onToggleMenu={() => setOpenMenuId((current) => (current === member.id ? null : member.id))}
                  onDelete={() => void deleteMember(member)}
                />
              ))
            )}
            {!loading && !filteredMembers.length ? (
              <div className="rounded-[20px] bg-white/90 p-6 text-center text-label text-[#65838b]">
                <Users size={32} className="mx-auto mb-2 text-[#9edddc]" />
                {t('noMembersFound')}
              </div>
            ) : null}
          </section>
        ) : (
          <MemberJoinRequestsPanel
            requests={filteredJoinRequests}
            loading={canReviewRequests ? joinRequestsLoading : false}
            feedback={canReviewRequests ? joinRequestFeedback : null}
            reviewInProgress={reviewInProgress}
            onReview={(request, status) => void reviewJoinRequest(request, status)}
          />
        )}
          </>
        ) : null}
      </div>

      {messId ? <FloatingActionLink href="/add-member" label={t('addMember')} icon={<UserPlus size={24} strokeWidth={2.4} />} /> : null}
    </MobileShell>
  )
}
