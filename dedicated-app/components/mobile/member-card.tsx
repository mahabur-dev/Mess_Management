'use client'

import Link from 'next/link'
import { BadgeCheck, Eye, Home, MoreVertical, Phone, Trash2, UserRound, Pencil } from 'lucide-react'

export type MobileMember = {
  id: string
  user_id: string
  mess_id: string
  role: string
  is_active: boolean
  room_no?: string | null
  seat_no?: string | null
  monthly_rent?: string | number | null
  deposit_amount?: string | number | null
  user?: {
    id: string
    name: string
    email: string
    phone?: string | null
    avatar_url?: string | null
  }
  mess?: { id: string; name: string }
}

export function getInitials(name?: string | null) {
  const source = name?.trim() || 'Member'
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function memberName(member: MobileMember) {
  return member.user?.name?.trim() || 'Member'
}

export function memberEditHref(member: MobileMember) {
  return `/edit-member?memberId=${encodeURIComponent(member.user_id)}&messId=${encodeURIComponent(member.mess_id)}`
}

export function MemberCard({
  member,
  menuOpen,
  deleting,
  onToggleMenu,
  onView,
  onDelete,
}: {
  member: MobileMember
  menuOpen: boolean
  deleting: boolean
  onToggleMenu: () => void
  onView: () => void
  onDelete: () => void
}) {
  const name = memberName(member)
  const phone = member.user?.phone?.trim()
  const roleLabel = member.role ? member.role.replaceAll('_', ' ') : 'MEMBER'

  return (
    <article className="member-card">
      <div className="member-avatar" aria-hidden="true">
        <span>{getInitials(name)}</span>
        <span className={`member-presence ${member.is_active ? 'bg-[#18c978]' : 'bg-[#9aaeb4]'}`} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-black leading-tight text-[#123748]">{name}</div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="member-role-badge">
            <BadgeCheck size={10} />
            {roleLabel}
          </span>
        </div>
        <div className="mt-1.5 flex min-w-0 items-center gap-1 text-[10px] font-semibold text-[#65838b]">
          <Home size={11} className="shrink-0" />
          <span className="truncate">{member.room_no ? `Room ${member.room_no}` : 'No room assigned'}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {phone ? (
          <a href={`tel:${phone}`} className="member-icon-button" aria-label={`Call ${name}`} title={`Call ${name}`}>
            <Phone size={15} />
          </a>
        ) : (
          <button type="button" className="member-icon-button text-[#9aaeb4]" disabled aria-label="No phone number" title="No phone number">
            <Phone size={15} />
          </button>
        )}

        <div className="relative">
          <button type="button" className="member-icon-button" onClick={onToggleMenu} aria-label={`${name} actions`} title="Member actions">
            <MoreVertical size={16} />
          </button>
          {menuOpen ? (
            <div className="member-menu">
              <button type="button" onClick={onView}>
                <Eye size={14} />
                View
              </button>
              <Link href={memberEditHref(member)}>
                <Pencil size={14} />
                Edit
              </Link>
              <button type="button" onClick={onDelete} disabled={deleting} className="text-[#c2410c]">
                <Trash2 size={14} />
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export function MemberDetailsModal({ member, onClose }: { member: MobileMember; onClose: () => void }) {
  const name = memberName(member)

  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-[#123748]/38 px-3 pb-3 backdrop-blur-sm" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <section className="w-full rounded-[24px] bg-white p-4 shadow-[0_24px_60px_rgba(18,55,72,0.22)]">
        <div className="flex items-center gap-3">
          <div className="member-avatar h-14 w-14 text-base">
            <span>{getInitials(name)}</span>
            <span className={`member-presence ${member.is_active ? 'bg-[#18c978]' : 'bg-[#9aaeb4]'}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-black text-[#123748]">{name}</h2>
            <p className="truncate text-xs font-semibold text-[#65838b]">{member.user?.email ?? 'No email'}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            ['Role', member.role || 'MEMBER'],
            ['Status', member.is_active ? 'Active' : 'Inactive'],
            ['Room', member.room_no || 'Not assigned'],
            ['Seat', member.seat_no || 'Not assigned'],
            ['Rent', member.monthly_rent ? `BDT ${Number(member.monthly_rent).toLocaleString()}` : 'Not set'],
            ['Deposit', member.deposit_amount ? `BDT ${Number(member.deposit_amount).toLocaleString()}` : 'Not set'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-[#cfeeed] bg-[#f9fffe] px-3 py-3">
              <div className="text-[10px] font-black uppercase tracking-[0.12em] text-[#65838b]">{label}</div>
              <div className="mt-1 truncate text-sm font-black text-[#123748]">{value}</div>
            </div>
          ))}
        </div>

        <button type="button" onClick={onClose} className="primary-btn mt-4 h-12 w-full">
          Close
        </button>
      </section>
    </div>
  )
}
