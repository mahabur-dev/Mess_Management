'use client'

import Link from 'next/link'
import { Edit3, Plus, Search, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { IconActionLink } from '@/components/mobile/action-links'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { api } from '@/lib/api'
import { useAuth } from '../providers'

type MemberItem = {
  id: string
  user_id: string
  mess_id: string
  role: string
  is_active: boolean
  room_no?: string | null
  monthly_rent?: string | number | null
  deposit_amount?: string | number | null
  user?: { id: string; name: string; email: string }
  mess?: { id: string; name: string }
}

export default function MembersPage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? '', [user])
  const [members, setMembers] = useState<MemberItem[]>([])

  useEffect(() => {
    if (!messId) return

    let alive = true
    api
      .getAllMembers({ limit: 500 })
      .then((res) => {
        if (!alive) return
        const list = Array.isArray(res.data) ? res.data : []
        setMembers(list.filter((item: MemberItem) => item.mess_id === messId))
      })
      .catch(() => {
        if (!alive) return
        setMembers([])
      })

    return () => {
      alive = false
    }
  }, [messId])

  return (
    <MobileShell>
      <TopScreen title="Members" subtitle="All members in your mess" />
      <div className="screen space-y-4">
        <div className="glass rounded-[24px] p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#008d8c]" size={18} />
            <input className="field pl-12" placeholder="Search member..." />
          </div>
          <div className="mt-4 flex gap-2 text-xs font-bold">
            <span className="rounded-full bg-[#008d8c] px-3 py-1.5 text-white">All ({members.length})</span>
            <span className="rounded-full bg-[#dff4f3] px-3 py-1.5 text-[#008d8c]">Active</span>
            <span className="rounded-full bg-[#dff4f3] px-3 py-1.5 text-[#008d8c]">Inactive</span>
          </div>
        </div>

        <Link href="/add-member" className="primary-btn flex items-center justify-center gap-2">
          <Plus size={18} /> Add Member
        </Link>

        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="glass flex items-center gap-3 rounded-[24px] p-4">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#dff4f3] text-[#008d8c]">
                <UserRound size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-extrabold text-[#123748]">{member.user?.name ?? 'Member'}</div>
                <div className="mt-1 text-xs text-[#65838b]">Role: {member.role}</div>
                <div className="mt-1 text-[11px] text-[#7da0a6]">
                  {member.room_no ? `Room ${member.room_no}` : 'No room assigned'}
                </div>
              </div>
              <IconActionLink
                href={`/edit-member?memberId=${encodeURIComponent(member.user_id)}&messId=${encodeURIComponent(member.mess_id)}`}
                label="Edit member"
                icon={<Edit3 size={16} />}
              />
            </div>
          ))}
          {!members.length ? <div className="rounded-[24px] bg-white/85 p-6 text-sm text-[#65838b]">No membership data found.</div> : null}
        </div>
      </div>
    </MobileShell>
  )
}
