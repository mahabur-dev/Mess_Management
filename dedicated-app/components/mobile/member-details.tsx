'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Armchair,
  Bed,
  Building2,
  CalendarDays,
  Clock3,
  Mail,
  Pencil,
  Phone,
  ShieldCheck,
  UserRound,
  WalletCards,
} from 'lucide-react'
import { getInitials, memberEditHref, type MobileMember } from '@/components/mobile/member-card'
import { appHref } from '@/lib/routes'

type DetailItem = {
  label: string
  value: ReactNode
  icon: LucideIcon
}

function formatRole(role?: string | null) {
  return role?.trim().replaceAll('_', ' ') || 'MEMBER'
}

function formatMoney(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return 'Not set'
  const amount = Number(value)
  return Number.isFinite(amount) ? `BDT ${amount.toLocaleString('en-US')}` : String(value)
}

function formatDate(value?: string | null, includeTime = false) {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return includeTime
    ? date.toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : date.toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })
}

function MemberDetailSection({ title, items }: { title: string; items: DetailItem[] }) {
  return (
    <section className="ui-card" aria-labelledby={`${title.toLowerCase().replaceAll(' ', '-')}-heading`}>
      <h2 id={`${title.toLowerCase().replaceAll(' ', '-')}-heading`} className="ui-section-title">
        {title}
      </h2>
      <div>
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex min-h-16 items-center gap-3 border-b border-[#e4eaec] py-3 last:border-b-0">
            <span className="ui-icon-tile ui-icon-tile--md bg-[#edfafa] text-[#008d8c]" aria-hidden="true">
              <Icon size={18} strokeWidth={2.25} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-caption font-semibold text-[#65838b]">{label}</span>
              <span className="mt-0.5 block text-label font-bold leading-snug text-[#123748] [overflow-wrap:anywhere]">
                {value}
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

export function MemberDetailsView({ member }: { member: MobileMember }) {
  const [imageFailed, setImageFailed] = useState(false)
  const name = member.user?.name?.trim() || 'Member'
  const email = member.user?.email?.trim() || 'Not provided'
  const phone = member.user?.phone?.trim() || ''
  const avatarUrl = member.user?.avatar_url?.trim() || ''
  const role = formatRole(member.role)
  const joined = member.joined_at || member.created_at
  const updated = member.updated_at || member.joined_at || member.created_at

  useEffect(() => {
    setImageFailed(false)
  }, [avatarUrl])

  const contactItems: DetailItem[] = [
    { label: 'Email address', value: email, icon: Mail },
    { label: 'Phone number', value: phone || 'Not provided', icon: Phone },
  ]
  const membershipItems: DetailItem[] = [
    { label: 'Mess', value: member.mess?.name || 'Current mess', icon: Building2 },
    { label: 'Role', value: role, icon: ShieldCheck },
    { label: 'Status', value: member.is_active ? 'Active' : 'Inactive', icon: Activity },
    { label: 'Room', value: member.room_no || 'Not assigned', icon: Bed },
    { label: 'Seat', value: member.seat_no || 'Not assigned', icon: Armchair },
  ]
  const financialItems: DetailItem[] = [
    { label: 'Monthly rent', value: formatMoney(member.monthly_rent), icon: WalletCards },
    { label: 'Deposit amount', value: formatMoney(member.deposit_amount), icon: WalletCards },
  ]
  const activityItems: DetailItem[] = [
    { label: 'Joined on', value: formatDate(joined), icon: CalendarDays },
    { label: 'Last updated', value: formatDate(updated, true), icon: Clock3 },
  ]

  return (
    <div className="space-y-4">
      <section className="ui-card" aria-labelledby="member-name">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0">
            <div className="grid h-full w-full place-items-center overflow-hidden rounded-[16px] bg-[#dff4f3] text-title-sm font-bold text-[#00777a]">
              {avatarUrl && !imageFailed ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" onError={() => setImageFailed(true)} />
              ) : (
                <span aria-hidden="true">{getInitials(name)}</span>
              )}
            </div>
            <span
              className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-[3px] border-white ${
                member.is_active ? 'bg-[#18c978]' : 'bg-[#9aaeb4]'
              }`}
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="ui-badge ui-badge--info">{role}</span>
              <span className={member.is_active ? 'ui-badge ui-badge--success' : 'ui-badge ui-badge--neutral'}>
                {member.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <h2 id="member-name" className="ui-card-title [overflow-wrap:anywhere]">
              {name}
            </h2>
            <p className="ui-card-subtitle break-all">{email}</p>
          </div>
        </div>
      </section>

      <MemberDetailSection title="Contact Information" items={contactItems} />
      <MemberDetailSection title="Membership Details" items={membershipItems} />
      <MemberDetailSection title="Financial Details" items={financialItems} />
      <MemberDetailSection title="Activity" items={activityItems} />

      <div className={`grid gap-3 pb-2 ${phone ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <Link href={appHref(memberEditHref(member))} className="ui-btn ui-btn--primary min-w-0 px-3">
          <Pencil size={17} strokeWidth={2.3} aria-hidden="true" />
          Edit member
        </Link>
        {phone ? (
          <a href={`tel:${phone}`} className="ui-btn ui-btn--secondary min-w-0 px-3">
            <Phone size={17} strokeWidth={2.3} aria-hidden="true" />
            Call member
          </a>
        ) : null}
      </div>
    </div>
  )
}
