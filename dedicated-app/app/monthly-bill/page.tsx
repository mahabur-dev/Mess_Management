'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  ReceiptText,
  ShieldCheck,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'
import { LoadingIndicator } from '@/components/loading-indicator'
import {
  BillingCalculationNotice,
  billingCalculationIsPending,
  type BillingCalculationStatus,
} from '@/components/mobile/billing-status-notice'
import { MonthPicker } from '@/components/mobile/date-picker'
import { InlineNotice, currentMonthValue } from '@/components/mobile/meals-design'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { api } from '@/lib/api'
import type { BillStatus } from '@/lib/form-options'
import { useLocaleFormatters, useLocalizedNotice, useTranslations } from '@/lib/i18n'
import { appHref } from '@/lib/routes'
import { useAuth } from '../providers'

type MyExpenseDetails = {
  foodBill?: number
  utilityBill?: number
  roomRent?: number
  total?: number
  transactionCount?: number
}

type MemberSummary = {
  id: string
  name: string
  email?: string | null
  avatar_url?: string | null
}

type BillItem = {
  id: string
  month: string
  status: BillStatus
  total_meals?: string | number | null
  meal_charge?: string | number | null
  food_bill?: string | number | null
  seat_rent?: string | number | null
  utility_share?: string | number | null
  deposit_total?: string | number | null
  paid_amount?: string | number | null
  final_due?: string | number | null
  prev_balance?: string | number | null
  balance?: string | number | null
  member?: MemberSummary
  close_requests?: Array<{
    id: string
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    original_balance?: string | number | null
  }>
}

type MemberRecord = {
  id: string
  user_id: string
  mess_id: string
  is_active?: boolean
  user?: {
    id?: string
    name?: string | null
    email?: string | null
    avatar_url?: string | null
  }
  mess?: { id: string }
}

function toNumber(value?: string | number | null) {
  const amount = Number(value ?? 0)
  return Number.isFinite(amount) ? amount : 0
}

function billCurrentCost(bill?: BillItem | null) {
  if (!bill) return 0
  return toNumber(bill.food_bill) + toNumber(bill.seat_rent) + toNumber(bill.utility_share)
}

function billTotalDeposit(bill?: BillItem | null) {
  if (!bill) return 0
  return toNumber(bill.deposit_total) + toNumber(bill.paid_amount)
}

function billRemaining(bill?: BillItem | null) {
  const balance = toNumber(bill?.balance)
  return balance < 0 ? Math.abs(balance) : 0
}

function memberInitials(name?: string | null) {
  return String(name || 'Member')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'M'
}

function OverviewCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: ReactNode
  icon: LucideIcon
}) {
  return (
    <article className="overview-card">
      <div className="flex items-start gap-2.5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-[#edfafa] text-[#008d8c]">
          <Icon size={16} strokeWidth={2.35} />
        </div>
        <div className="min-w-0">
          <div className="overview-card-label">{label}</div>
          <div className="overview-card-value text-[#008d8c]">{value}</div>
        </div>
      </div>
    </article>
  )
}

function memberAvatarUrl(bill: BillItem, member?: MemberRecord) {
  return bill.member?.avatar_url ?? member?.user?.avatar_url ?? null
}

function MemberPhoto({
  avatarUrl,
  name,
}: {
  avatarUrl?: string | null
  name?: string | null
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const normalizedUrl = avatarUrl?.trim()

  if (!normalizedUrl || imageFailed) {
    return (
      <span className="monthly-member-row__avatar monthly-member-row__avatar--fallback" aria-hidden="true">
        {memberInitials(name)}
      </span>
    )
  }

  return (
    <span className="monthly-member-row__avatar">
      <img src={normalizedUrl} alt="" className="h-full w-full object-cover" onError={() => setImageFailed(true)} />
    </span>
  )
}

function MemberBillRow({
  bill,
  member,
  messId,
}: {
  bill: BillItem
  member?: MemberRecord
  messId: string
}) {
  const t = useTranslations('billing')
  const name = bill.member?.name || member?.user?.name || t('memberFallback')
  const email = bill.member?.email || member?.user?.email || t('emailNotAvailable')
  const isPaid = bill.status === 'PAID' || toNumber(bill.final_due) <= 0
  const closeStatus = bill.close_requests?.[0]?.status

  return (
    <Link
      href={appHref(`/member-details?memberId=${encodeURIComponent(bill.member?.id ?? '')}&messId=${encodeURIComponent(member?.mess_id ?? messId)}&month=${encodeURIComponent(String(bill.month).slice(0, 7))}`)}
      className="monthly-member-row"
      aria-label={t('viewMemberBillDetails', { name })}
    >
      <MemberPhoto avatarUrl={memberAvatarUrl(bill, member)} name={name} />
      <span className="monthly-member-row__identity">
        <strong>{name}</strong>
        <small>{email}</small>
      </span>
      <span className="monthly-member-row__status" data-status={closeStatus === 'PENDING' ? 'due' : closeStatus === 'APPROVED' || isPaid ? 'paid' : 'due'}>
        {closeStatus === 'PENDING' ? t('closePending') : closeStatus === 'APPROVED' ? t('closed') : isPaid ? t('paid') : t('due')}
      </span>
    </Link>
  )
}

export default function MonthlyBillPage() {
  const t = useTranslations('billing')
  const format = useLocaleFormatters()
  const { notice, clearNotice, showError } = useLocalizedNotice('billing')
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const [month, setMonth] = useState(currentMonthValue())
  const [details, setDetails] = useState<MyExpenseDetails | null>(null)
  const [bills, setBills] = useState<BillItem[]>([])
  const [members, setMembers] = useState<MemberRecord[]>([])
  const [billingStatus, setBillingStatus] = useState<BillingCalculationStatus | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!messId) return
    let alive = true
    let billingTimer: ReturnType<typeof setTimeout> | null = null

    const refreshBills = () => {
      api
        .getBillsByMess(messId, { month: `${month}-01`, limit: 500, sortBy: 'generated_at', sortOrder: 'desc' })
        .then((response) => {
          if (!alive) return
          setBills(Array.isArray(response.data) ? (response.data as BillItem[]) : [])
          setBillingStatus(response.billing?.status ?? null)
          if (response.billing && response.billing.status !== 'READY' && response.billing.status !== 'FAILED') {
            billingTimer = setTimeout(refreshBills, 1500)
          }
        })
        .catch((error) => {
          if (alive) showError(error, 'loadDetailsFailed')
        })
    }

    setLoading(true)
    setBillingStatus(null)
    clearNotice()

    let firstLoadError: unknown = null
    const recordLoadError = (error: unknown) => {
      firstLoadError ??= error
    }

    Promise.all([
      api.getMyExpenseDetails(messId, `${month}-01`).catch((error) => {
        recordLoadError(error)
        return { data: null }
      }),
      api.getBillsByMess(messId, { month: `${month}-01`, limit: 500, sortBy: 'generated_at', sortOrder: 'desc' }).catch((error) => {
        recordLoadError(error)
        return { data: [], billing: null }
      }),
      api.getMessMemberOptions(messId).catch((error) => {
        recordLoadError(error)
        return { data: [] }
      }),
    ])
      .then(([detailRes, billRes, memberRes]) => {
        if (!alive) return
        const billList = Array.isArray(billRes.data) ? (billRes.data as BillItem[]) : []
        const memberList = Array.isArray(memberRes.data) ? memberRes.data : []
        setDetails((detailRes.data ?? null) as MyExpenseDetails | null)
        setBills(billList)
        setBillingStatus(billRes.billing?.status ?? null)
        setMembers(memberList.map((member) => ({
          id: `${messId}:${member.id}`,
          user_id: member.id,
          mess_id: messId,
          is_active: true,
          user: member,
        })))
        if (billRes.billing && billRes.billing.status !== 'READY' && billRes.billing.status !== 'FAILED') {
          billingTimer = setTimeout(refreshBills, 1500)
        }
        if (firstLoadError) showError(firstLoadError, 'partialDetailsLoadFailed')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
      if (billingTimer) clearTimeout(billingTimer)
    }
  }, [clearNotice, messId, month, showError])

  const myBill = useMemo(() => bills.find((bill) => bill.member?.id === user?.id) ?? null, [bills, user?.id])
  const memberByUserId = useMemo(() => new Map(members.map((member) => [member.user_id, member])), [members])
  const visibleBills = useMemo(
    () => bills.filter((bill) => memberByUserId.has(bill.member?.id ?? '')),
    [bills, memberByUserId],
  )
  const totalCost = myBill ? billCurrentCost(myBill) : toNumber(details?.total)
  const totalDeposit = myBill ? billTotalDeposit(myBill) : 0
  const totalDue = myBill ? toNumber(myBill.final_due) : 0
  const totalRemaining = myBill ? billRemaining(myBill) : Math.max(totalDeposit - totalCost, 0)

  return (
    <MobileShell showBottomNavigation>
      <TopScreen title={t('monthlyBillManagement')} subtitle={format.month(`${month}-01`)} backHref="/" />

      <div className="screen monthly-bill-page space-y-4">
        <div className="meal-month-action-bar">
          <MonthPicker
            label={t('selectMonth')}
            value={month}
            onChange={setMonth}
            renderTrigger={({ open, selectedLabel, buttonProps }) => (
              <button {...buttonProps} className="home-month-pill meal-month-trigger">
                <CalendarDays size={15} strokeWidth={2.35} aria-hidden="true" />
                <span>{selectedLabel}</span>
                <ChevronDown size={15} strokeWidth={2.35} className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
            )}
          />
          <Link href={appHref(`/monthly-bill/my-details?month=${encodeURIComponent(month)}`)} className="full-month-meal-link">
            <ReceiptText size={16} strokeWidth={2.25} aria-hidden="true" />
            <span>{t('myDetails')}</span>
          </Link>
        </div>

        {notice ? <InlineNotice tone={notice.tone}>{notice.message}</InlineNotice> : null}
        <BillingCalculationNotice status={billingStatus} />

        <section>
          <div className="section-title">{t('myOverview')}</div>
          <div className="grid grid-cols-2 gap-3">
            <OverviewCard label={t('totalDeposit')} icon={CircleDollarSign} value={loading ? <LoadingIndicator size="sm" label={t('loadingDeposit')} /> : format.money(totalDeposit)} />
            <OverviewCard label={t('totalCost')} icon={ReceiptText} value={loading ? <LoadingIndicator size="sm" label={t('loadingCost')} /> : format.money(totalCost)} />
            <OverviewCard label={t('totalDue')} icon={WalletCards} value={loading ? <LoadingIndicator size="sm" label={t('loadingDue')} /> : format.money(totalDue)} />
            <OverviewCard label={t('totalRemaining')} icon={ShieldCheck} value={loading ? <LoadingIndicator size="sm" label={t('loadingRemaining')} /> : format.money(totalRemaining)} />
          </div>
        </section>

        <section className="monthly-member-overview" aria-labelledby="member-bill-overview-title">
          <div className="monthly-member-overview__header">
            <div>
              <p>{t('memberBills')}</p>
              <h2 id="member-bill-overview-title">{t('memberOverview')}</h2>
            </div>
            <span>{loading ? '—' : format.number(visibleBills.length)}</span>
          </div>

          {loading ? (
            <div className="monthly-member-overview__loading">
              <LoadingIndicator size="sm" label={t('loadingMemberBills')} />
              <span>{t('loadingMemberBillsProgress')}</span>
            </div>
          ) : null}
          {!loading && visibleBills.length ? (
            <div className="monthly-member-overview__list">
              {visibleBills.map((bill) => (
                <MemberBillRow key={bill.id} bill={bill} member={memberByUserId.get(bill.member?.id ?? '')} messId={messId} />
              ))}
            </div>
          ) : null}
          {!loading && !visibleBills.length && !billingCalculationIsPending(billingStatus) ? (
            <div className="monthly-member-overview__empty">
              {t('noGeneratedBills')}
            </div>
          ) : null}

        </section>

        <div className="pb-2" />
      </div>
    </MobileShell>
  )
}
