'use client'

import Link from 'next/link'
import { Activity, Armchair, BadgeCheck, Bed, CalendarDays, Clock3, Eye, Home, MoreVertical, Phone, ShieldCheck, Trash2, User, WalletCards, X, Pencil } from 'lucide-react'
import { useNativeBackAction } from '@/components/native-back-actions'

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
  joined_at?: string | null
  updated_at?: string | null
  created_at?: string | null
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
  variant = 'card',
}: {
  member: MobileMember
  menuOpen: boolean
  deleting: boolean
  onToggleMenu: () => void
  onView: () => void
  onDelete: () => void
  variant?: 'card' | 'horizontal'
}) {
  useNativeBackAction(menuOpen, () => {
    onToggleMenu()
    return true
  })

  const name = memberName(member)
  const phone = member.user?.phone?.trim()
  const roleLabel = member.role ? member.role.replaceAll('_', ' ') : 'MEMBER'
  const isHorizontal = variant === 'horizontal'

  return (
    <article className={isHorizontal ? 'member-card member-card--horizontal' : 'member-card'}>
      <div className="member-avatar" aria-hidden="true">
        <span>{getInitials(name)}</span>
        <span className={`member-presence ${member.is_active ? 'bg-[#18c978]' : 'bg-[#9aaeb4]'}`} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-label font-bold leading-tight text-[#123748]">{name}</div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="member-role-badge">
            <BadgeCheck size={10} />
            {roleLabel}
          </span>
        </div>
        <div className="mt-1.5 flex min-w-0 items-center gap-1 text-caption font-semibold text-[#65838b]">
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
  useNativeBackAction(true, () => {
    onClose()
    return true
  })

  const name = memberName(member)
  const roleLabel = member.role ? member.role.replaceAll('_', ' ') : 'MEMBER'
  const joined = member.joined_at || member.created_at
  const updated = member.updated_at || member.joined_at || member.created_at
  const formatDate = (value?: string | null) => {
    if (!value) return 'Not set'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })
  }
  const formatDateTime = (value?: string | null) => {
    if (!value) return 'Not set'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString('en-US', { day: '2-digit', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' })
  }
  const tiles = [
    { label: 'Role', value: roleLabel, icon: User, bg: '#e8fbfa', fg: '#008d8c' },
    { label: 'Status', value: member.is_active ? 'Active' : 'Inactive', icon: Activity, bg: '#e8fbfa', fg: '#008d8c' },
    { label: 'Room', value: member.room_no || 'Not assigned', icon: Bed, bg: '#edf7ff', fg: '#1f7ae0' },
    { label: 'Seat', value: member.seat_no || 'Not assigned', icon: Armchair, bg: '#f3eaff', fg: '#9a4be8' },
    {
      label: 'Rent',
      value: member.monthly_rent ? `BDT ${Number(member.monthly_rent).toLocaleString('en-US')}` : 'Not set',
      icon: WalletCards,
      bg: '#fff4df',
      fg: '#f39b00',
    },
    {
      label: 'Deposit',
      value: member.deposit_amount ? `BDT ${Number(member.deposit_amount).toLocaleString('en-US')}` : 'Not set',
      icon: WalletCards,
      bg: '#ffeaf1',
      fg: '#eb3d72',
    },
  ]

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-[#123748]/38 px-4 py-3 backdrop-blur-[7px]" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <section className="member-overview-modal w-full max-w-[398px]">
        <div className="relative z-10 flex items-start gap-3">
          <div className="member-avatar h-12 w-12 text-label">
            <span>{getInitials(name)}</span>
            <span className={`member-presence ${member.is_active ? 'bg-[#18c978]' : 'bg-[#9aaeb4]'}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-title-sm font-bold text-[#123748]">{name}</h2>
            <p className="mt-1 truncate text-caption font-bold text-[#65838b]">{member.user?.email ?? 'No email'}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#cfeeed] bg-[#edfafa] px-3 py-1.5 text-caption font-bold uppercase tracking-[0.12em] text-[#008d8c]">
              <User size={13} />
              {roleLabel}
            </span>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#dce5ec] bg-white text-[#008d8c]" aria-label="Close member overview">
            <X size={18} />
          </button>
        </div>

        <div className="relative z-10 mt-4 rounded-[14px] border border-[#cfeeed] bg-[#edfafa] p-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#0aa0a0] to-[#008d8c] text-white">
              <ShieldCheck size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-caption font-bold text-[#65838b]">Status</div>
              <div className="mt-0.5 text-body font-bold text-[#008d8c]">{member.is_active ? 'Active' : 'Inactive'}</div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dff4f3] px-2.5 py-1.5 text-caption font-bold text-[#008d8c]">
              <BadgeCheck size={13} />
              Verified
            </span>
          </div>
        </div>

        <div className="relative z-10 mt-4">
          <h3 className="text-body font-bold text-[#123748]">Member Overview</h3>
          <div className="mt-2 h-1 w-8 rounded-full bg-[#008d8c]" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            {tiles.map((tile) => {
              const Icon = tile.icon
              return (
                <div key={tile.label} className="member-overview-card">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ backgroundColor: tile.bg, color: tile.fg }}>
                      <Icon size={17} />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-caption font-bold uppercase text-[#65838b]">{tile.label}</div>
                      <div className="mt-1 truncate text-label font-bold text-[#123748]">{tile.value}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="relative z-10 mt-4 divide-y divide-[#dce5ec] border-t border-[#dce5ec]">
          <div className="flex items-center gap-3 py-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e8fbfa] text-[#008d8c]">
              <CalendarDays size={16} />
            </span>
            <span className="flex-1 text-caption font-bold text-[#65838b]">Joined On</span>
            <span className="max-w-[150px] text-right text-caption font-bold text-[#123748]">{formatDate(joined)}</span>
          </div>
          <div className="flex items-center gap-3 py-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e8fbfa] text-[#008d8c]">
              <Clock3 size={16} />
            </span>
            <span className="flex-1 text-caption font-bold text-[#65838b]">Last Updated</span>
            <span className="max-w-[170px] text-right text-caption font-bold text-[#123748]">{formatDateTime(updated)}</span>
          </div>
        </div>

        <button type="button" onClick={onClose} className="primary-btn relative z-10 mt-2 flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] text-label">
          <X size={18} />
          Close
        </button>
      </section>
    </div>
  )
}
