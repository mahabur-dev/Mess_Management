'use client'

import { useEffect, useId, useState, type ReactNode } from 'react'
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
import { memberRoleLabel, useLocale, useLocaleFormatters, useTranslations } from '@/lib/i18n'
import { appHref } from '@/lib/routes'

type DetailItem = {
  label: string
  value: ReactNode
  icon: LucideIcon
}

function MemberDetailSection({ title, items }: { title: string; items: DetailItem[] }) {
  const headingId = useId()
  return (
    <section className="ui-card" aria-labelledby={headingId}>
      <h2 id={headingId} className="ui-section-title">
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
              <span className="mt-0.5 block text-label font-semibold leading-snug text-[#123748] [overflow-wrap:anywhere]">
                {value}
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

export function MemberDetailsView({
  member,
  showActions = true,
}: {
  member: MobileMember
  showActions?: boolean
}) {
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const t = useTranslations('members')
  const [imageFailed, setImageFailed] = useState(false)
  const name = member.user?.name?.trim() || t('memberFallback')
  const email = member.user?.email?.trim() || t('notProvided')
  const phone = member.user?.phone?.trim() || ''
  const avatarUrl = member.user?.avatar_url?.trim() || ''
  const role = memberRoleLabel(member.role || 'MEMBER', locale)
  const joined = member.joined_at || member.created_at
  const updated = member.updated_at || member.joined_at || member.created_at

  useEffect(() => {
    setImageFailed(false)
  }, [avatarUrl])

  const memberMoney = (value?: string | number | null) => {
    if (value === null || value === undefined || value === '') return t('notSet')
    return Number.isFinite(Number(value)) ? format.money(value) : String(value)
  }
  const memberDate = (value?: string | null, includeTime = false) => {
    if (!value) return t('notSet')
    return format.date(value, includeTime
      ? { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }
      : { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const contactItems: DetailItem[] = [
    { label: t('emailAddress'), value: email, icon: Mail },
    { label: t('phoneNumber'), value: phone || t('notProvided'), icon: Phone },
  ]
  const membershipItems: DetailItem[] = [
    { label: t('mess'), value: member.mess?.name || t('currentMess'), icon: Building2 },
    { label: t('role'), value: role, icon: ShieldCheck },
    { label: t('status'), value: member.is_active ? t('active') : t('inactive'), icon: Activity },
    { label: t('room'), value: member.room_no || t('notAssigned'), icon: Bed },
    { label: t('seat'), value: member.seat_no || t('notAssigned'), icon: Armchair },
  ]
  const financialItems: DetailItem[] = [
    { label: t('monthlyRent'), value: memberMoney(member.monthly_rent), icon: WalletCards },
    { label: t('depositAmount'), value: memberMoney(member.deposit_amount), icon: WalletCards },
  ]
  const activityItems: DetailItem[] = [
    { label: t('joinedOn'), value: memberDate(joined), icon: CalendarDays },
    { label: t('lastUpdated'), value: memberDate(updated, true), icon: Clock3 },
  ]

  return (
    <div className="space-y-4">
      <section className="ui-card" aria-labelledby="member-name">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0">
            <div className="grid h-full w-full place-items-center overflow-hidden rounded-[16px] bg-[#dff4f3] text-title-sm font-semibold text-[#00777a]">
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
                {member.is_active ? t('active') : t('inactive')}
              </span>
            </div>
            <h2 id="member-name" className="ui-card-title [overflow-wrap:anywhere]">
              {name}
            </h2>
            <p className="ui-card-subtitle break-all">{email}</p>
          </div>
        </div>
      </section>

      <MemberDetailSection title={t('contactInformation')} items={contactItems} />
      <MemberDetailSection title={t('membershipDetails')} items={membershipItems} />
      <MemberDetailSection title={t('financialDetails')} items={financialItems} />
      <MemberDetailSection title={t('activity')} items={activityItems} />

      {showActions ? (
        <div className={`grid gap-3 pb-2 ${phone ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <Link href={appHref(memberEditHref(member))} className="ui-btn ui-btn--primary min-w-0 px-3">
            <Pencil size={17} strokeWidth={2.3} aria-hidden="true" />
            {t('editMember')}
          </Link>
          {phone ? (
            <a href={`tel:${phone}`} className="ui-btn ui-btn--secondary min-w-0 px-3">
              <Phone size={17} strokeWidth={2.3} aria-hidden="true" />
              {t('callMember')}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
