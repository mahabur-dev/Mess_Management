'use client'

import { Search, UserPlus, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { FloatingActionLink } from '@/components/mobile/floating-action-link'
import { IconInput } from '@/components/mobile/icon-input'
import { MemberCard, MemberDetailsModal, type MobileMember } from '@/components/mobile/member-card'
import { MemberJoinRequestsPanel } from '@/components/mobile/member-join-requests'
import { MobileShell } from '@/components/mobile-shell'
import { LoadingIndicator } from '@/components/loading-indicator'
import { TopScreen } from '@/components/top-screen'
import { api } from '@/lib/api'
import { canManageMess } from '@/lib/app-permissions'
import type { MemberJoinRequest, MemberJoinReviewStatus } from '@/lib/member-join-requests'
import { useAuth } from '../providers'

type MemberFilter = 'ALL' | 'ACTIVE' | 'INACTIVE'

export default function MembersPage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const canReviewRequests = canManageMess(user)
  const [members, setMembers] = useState<MobileMember[]>([])
  const [joinRequests, setJoinRequests] = useState<MemberJoinRequest[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<MemberFilter>('ALL')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [viewingMember, setViewingMember] = useState<MobileMember | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [joinRequestsLoading, setJoinRequestsLoading] = useState(false)
  const [joinRequestFeedback, setJoinRequestFeedback] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [reviewInProgress, setReviewInProgress] = useState<{ requestId: string; status: MemberJoinReviewStatus } | null>(null)

  async function loadMembers() {
    if (!messId) return
    setLoading(true)
    setMessage('')
    try {
      const res = await api.getAllMembers({ limit: 500, searchTerm: search.trim() || undefined })
      const list = Array.isArray(res.data) ? res.data : []
      setMembers(list.filter((item: MobileMember) => item.mess_id === messId || item.mess?.id === messId))
    } catch (error) {
      setMembers([])
      setMessage(error instanceof Error ? error.message : 'Failed to load members.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let alive = true
    if (!messId) return

    setLoading(true)
    setMessage('')
    api
      .getAllMembers({ limit: 500, searchTerm: search.trim() || undefined })
      .then((res) => {
        if (!alive) return
        const list = Array.isArray(res.data) ? res.data : []
        setMembers(list.filter((item: MobileMember) => item.mess_id === messId || item.mess?.id === messId))
      })
      .catch((error) => {
        if (!alive) return
        setMembers([])
        setMessage(error instanceof Error ? error.message : 'Failed to load members.')
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
    setJoinRequestFeedback(null)
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
        setJoinRequestFeedback({
          tone: 'error',
          text: error instanceof Error ? error.message : 'Failed to load join requests.',
        })
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
      const matchesFilter = filter === 'ALL' || (filter === 'ACTIVE' ? member.is_active : !member.is_active)
      const text = `${member.user?.name ?? ''} ${member.user?.email ?? ''} ${member.user?.phone ?? ''} ${member.room_no ?? ''}`.toLowerCase()
      return matchesFilter && (!term || text.includes(term))
    })
  }, [filter, members, search])

  async function deleteMember(member: MobileMember) {
    setOpenMenuId(null)
    if (!window.confirm(`Delete ${member.user?.name ?? 'this member'} from this mess?`)) return

    setDeletingId(member.id)
    setMessage('')
    try {
      await api.removeMember(member.mess_id, member.user_id)
      setMembers((current) => current.filter((item) => item.id !== member.id))
      setMessage('Member deleted successfully.')
      await loadMembers()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete member.')
    } finally {
      setDeletingId(null)
    }
  }

  async function reviewJoinRequest(request: MemberJoinRequest, status: MemberJoinReviewStatus) {
    if (reviewInProgress) return

    setReviewInProgress({ requestId: request.id, status })
    setJoinRequestFeedback(null)
    try {
      await api.reviewMemberJoinRequest(request.id, status)
      setJoinRequests((current) => current.filter((item) => item.id !== request.id))
      setJoinRequestFeedback({
        tone: 'success',
        text: `${request.requester.name}'s request was ${status === 'APPROVED' ? 'approved' : 'rejected'}.`,
      })
      if (status === 'APPROVED') await loadMembers()
    } catch (error) {
      setJoinRequestFeedback({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to review join request.',
      })
    } finally {
      setReviewInProgress(null)
    }
  }

  const counts = {
    all: members.length,
    active: members.filter((member) => member.is_active).length,
    inactive: members.filter((member) => !member.is_active).length,
  }

  return (
    <MobileShell hasFloatingAction>
      <TopScreen title="Members" subtitle="All members in your mess" backHref="/" />
      <div className="screen space-y-4">
        {canReviewRequests ? (
          <MemberJoinRequestsPanel
            requests={joinRequests}
            loading={joinRequestsLoading}
            feedback={joinRequestFeedback}
            reviewInProgress={reviewInProgress}
            onReview={(request, status) => void reviewJoinRequest(request, status)}
          />
        ) : null}

        <section className="rounded-[20px] bg-white px-4 py-4 shadow-[0_10px_24px_rgba(0,119,122,0.08)]">
          <IconInput icon={Search} placeholder="Search member..." value={search} onChange={(event) => setSearch(event.target.value)} />
          <div className="mt-4 grid grid-cols-3 gap-2 text-caption font-bold">
            {[
              ['ALL', `All (${counts.all})`],
              ['ACTIVE', `Active (${counts.active})`],
              ['INACTIVE', `Inactive (${counts.inactive})`],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value as MemberFilter)}
                className={`h-9 rounded-full transition active:scale-[0.98] ${
                  filter === value ? 'bg-[#008d8c] text-white shadow-[0_8px_18px_rgba(0,119,122,0.18)]' : 'bg-[#edfafa] text-[#008d8c]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {message ? <div className="rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-label font-semibold text-[#008d8c]">{message}</div> : null}

        <section className="flush-list">
          {loading ? (
            <LoadingIndicator variant="card" label="Loading members" />
          ) : (
            filteredMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                variant="horizontal"
                menuOpen={openMenuId === member.id}
                deleting={deletingId === member.id}
                onToggleMenu={() => setOpenMenuId((current) => (current === member.id ? null : member.id))}
                onView={() => {
                  setOpenMenuId(null)
                  setViewingMember(member)
                }}
                onDelete={() => void deleteMember(member)}
              />
            ))
          )}
          {!loading && !filteredMembers.length ? (
            <div className="rounded-[20px] bg-white/90 p-6 text-center text-label text-[#65838b]">
              <Users size={32} className="mx-auto mb-2 text-[#9edddc]" />
              No members found.
            </div>
          ) : null}
        </section>
      </div>

      <FloatingActionLink href="/add-member" label="Add member" icon={<UserPlus size={24} strokeWidth={2.4} />} />
      {viewingMember ? <MemberDetailsModal member={viewingMember} onClose={() => setViewingMember(null)} /> : null}
    </MobileShell>
  )
}
