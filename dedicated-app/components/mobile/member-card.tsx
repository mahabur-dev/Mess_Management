'use client'

import Link from 'next/link'
import { BadgeCheck, Eye, Home, MoreVertical, Pencil, Phone, Trash2 } from 'lucide-react'
import { useNativeBackAction } from '@/components/native-back-actions'
import { memberRoleLabel, useLocale, useTranslations } from '@/lib/i18n'

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

export function memberEditHref(member: MobileMember) {
  return `/edit-member?memberId=${encodeURIComponent(member.user_id)}&messId=${encodeURIComponent(member.mess_id)}`
}

export function memberDetailsHref(member: MobileMember) {
  return `/member-details?memberId=${encodeURIComponent(member.user_id)}&messId=${encodeURIComponent(member.mess_id)}`
}

export function MemberCard({
  member,
  menuOpen,
  deleting,
  onToggleMenu,
  onDelete,
  variant = 'card',
}: {
  member: MobileMember
  menuOpen: boolean
  deleting: boolean
  onToggleMenu: () => void
  onDelete: () => void
  variant?: 'card' | 'horizontal'
}) {
  const { locale } = useLocale()
  const t = useTranslations('members')
  useNativeBackAction(menuOpen, () => {
    onToggleMenu()
    return true
  })

  const name = member.user?.name?.trim() || t('memberFallback')
  const phone = member.user?.phone?.trim()
  const roleLabel = memberRoleLabel(member.role || 'MEMBER', locale)
  const isHorizontal = variant === 'horizontal'

  return (
    <article className={isHorizontal ? 'member-card member-card--horizontal' : 'member-card'}>
      <div className="member-avatar" aria-hidden="true">
        <span>{getInitials(name)}</span>
        <span className={`member-presence ${member.is_active ? 'bg-[#18c978]' : 'bg-[#9aaeb4]'}`} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-label font-semibold leading-tight text-[#123748]">{name}</div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="member-role-badge">
            <BadgeCheck size={10} />
            {roleLabel}
          </span>
        </div>
        <div className="mt-1.5 flex min-w-0 items-center gap-1 text-caption font-semibold text-[#65838b]">
          <Home size={11} className="shrink-0" />
          <span className="truncate">{member.room_no ? t('roomNumber', { room: member.room_no }) : t('noRoomAssigned')}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {phone ? (
          <a href={`tel:${phone}`} className="member-icon-button" aria-label={t('callNamedMember', { name })} title={t('callNamedMember', { name })}>
            <Phone size={15} />
          </a>
        ) : (
          <button type="button" className="member-icon-button text-[#9aaeb4]" disabled aria-label={t('noPhoneNumber')} title={t('noPhoneNumber')}>
            <Phone size={15} />
          </button>
        )}

        <div className="relative">
          <button type="button" className="member-icon-button" onClick={onToggleMenu} aria-label={t('memberActions', { name })} title={t('memberActions', { name })}>
            <MoreVertical size={16} />
          </button>
          {menuOpen ? (
            <div className="member-menu">
              <Link href={memberDetailsHref(member)}>
                <Eye size={14} />
                {t('view')}
              </Link>
              <Link href={memberEditHref(member)}>
                <Pencil size={14} />
                {t('edit')}
              </Link>
              <button type="button" onClick={onDelete} disabled={deleting} data-tone="danger">
                <Trash2 size={14} />
                {deleting ? t('deleting') : t('delete')}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}
