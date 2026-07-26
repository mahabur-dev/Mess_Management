'use client'

import { Search, UserPlus, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { FloatingActionLink } from '@/components/mobile/floating-action-link'
import { IconInput } from '@/components/mobile/icon-input'
import { MemberCard, MemberDetailsModal, type MobileMember } from '@/components/mobile/member-card'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { api } from '@/lib/api'
import { useAuth } from '../providers'

type MemberFilter = 'ALL' | 'ACTIVE' | 'INACTIVE'

export default function MembersPage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const [members, setMembers] = useState<MobileMember[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<MemberFilter>('ALL')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [viewingMember, setViewingMember] = useState<MobileMember | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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

  const counts = {
    all: members.length,
    active: members.filter((member) => member.is_active).length,
    inactive: members.filter((member) => !member.is_active).length,
  }

  return (
    <MobileShell hasFloatingAction>
      <TopScreen title="Members" subtitle="All members in your mess" backHref="/" />
      <div className="screen space-y-4">
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
            <div className="rounded-[20px] bg-white/90 p-6 text-center text-label font-bold text-[#65838b]">Loading members...</div>
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
