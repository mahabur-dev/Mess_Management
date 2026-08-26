'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  CalendarDays,
  CircleDollarSign,
  ReceiptText,
  ShieldCheck,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'
import { LoadingIndicator } from '@/components/loading-indicator'
import { AssistantSummaryCard } from '@/components/mobile/assistant-summary-card'
import { formatTaka } from '@/components/mobile/expense-design'
import { InlineNotice, MealMonthSelector, currentMonthValue, formatMonthLabel } from '@/components/mobile/meals-design'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { api } from '@/lib/api'
import type { BillStatus } from '@/lib/form-options'
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
  const name = bill.member?.name || member?.user?.name || 'Member'
  const email = bill.member?.email || member?.user?.email || 'Email not available'
  const isPaid = bill.status === 'PAID' || toNumber(bill.final_due) <= 0
  const closeStatus = bill.close_requests?.[0]?.status

  return (
    <Link
      href={appHref(`/member-details?memberId=${encodeURIComponent(bill.member?.id ?? '')}&messId=${encodeURIComponent(member?.mess_id ?? messId)}&month=${encodeURIComponent(String(bill.month).slice(0, 7))}`)}
      className="monthly-member-row"
      aria-label={`View ${name} monthly bill details`}
    >
      <MemberPhoto avatarUrl={memberAvatarUrl(bill, member)} name={name} />
      <span className="monthly-member-row__identity">
        <strong>{name}</strong>
        <small>{email}</small>
      </span>
      <span className="monthly-member-row__status" data-status={closeStatus === 'PENDING' ? 'due' : closeStatus === 'APPROVED' || isPaid ? 'paid' : 'due'}>
        {closeStatus === 'PENDING' ? 'Close pending' : closeStatus === 'APPROVED' ? 'Closed' : isPaid ? 'Paid' : 'Due'}
      </span>
    </Link>
  )
}

export default function MonthlyBillPage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const [month, setMonth] = useState(currentMonthValue())
  const [details, setDetails] = useState<MyExpenseDetails | null>(null)
  const [bills, setBills] = useState<BillItem[]>([])
  const [members, setMembers] = useState<MemberRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

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
          if (response.billing && response.billing.status !== 'READY' && response.billing.status !== 'FAILED') {
            billingTimer = setTimeout(refreshBills, 1500)
          }
        })
        .catch(() => undefined)
    }

    setLoading(true)
    setMessage('')

    Promise.all([
      api.getMyExpenseDetails(messId, `${month}-01`).catch((error) => {
        if (alive) setMessage(error instanceof Error ? error.message : 'Failed to load your bill overview.')
        return { data: null }
      }),
      api.getBillsByMess(messId, { month: `${month}-01`, limit: 500, sortBy: 'generated_at', sortOrder: 'desc' }).catch(() => ({ data: [], billing: null })),
      api.getAllMembers({ limit: 500 }).catch(() => ({ data: [] })),
    ])
      .then(([detailRes, billRes, memberRes]) => {
        if (!alive) return
        const billList = Array.isArray(billRes.data) ? (billRes.data as BillItem[]) : []
        const memberList = Array.isArray(memberRes.data) ? (memberRes.data as MemberRecord[]) : []
        setDetails((detailRes.data ?? null) as MyExpenseDetails | null)
        setBills(billList)
        setMembers(memberList.filter((member) => member.mess_id === messId || member.mess?.id === messId))
        if (billRes.billing && billRes.billing.status !== 'READY' && billRes.billing.status !== 'FAILED') {
          billingTimer = setTimeout(refreshBills, 1500)
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
      if (billingTimer) clearTimeout(billingTimer)
    }
  }, [messId, month])

  const myBill = useMemo(() => bills.find((bill) => bill.member?.id === user?.id) ?? null, [bills, user?.id])
  const memberByUserId = useMemo(() => new Map(members.map((member) => [member.user_id, member])), [members])
  const totalCost = myBill ? billCurrentCost(myBill) : toNumber(details?.total)
  const totalDeposit = myBill ? billTotalDeposit(myBill) : 0
  const totalDue = myBill ? toNumber(myBill.final_due) : 0
  const totalRemaining = myBill ? billRemaining(myBill) : Math.max(totalDeposit - totalCost, 0)

  return (
    <MobileShell showBottomNavigation>
      <TopScreen title="Monthly Bill Management" subtitle={formatMonthLabel(month)} backHref="/" />

      <div className="screen space-y-4">
        <MealMonthSelector month={month} onChange={setMonth} />

        {message ? <InlineNotice tone="danger">{message}</InlineNotice> : null}

        <section>
          <div className="section-title">My Overview</div>
          <div className="grid grid-cols-2 gap-3">
            <OverviewCard label="Total Deposit" icon={CircleDollarSign} value={loading ? <LoadingIndicator size="sm" label="Loading deposit" /> : formatTaka(totalDeposit)} />
            <OverviewCard label="Total Cost" icon={ReceiptText} value={loading ? <LoadingIndicator size="sm" label="Loading cost" /> : formatTaka(totalCost)} />
            <OverviewCard label="Total Due" icon={WalletCards} value={loading ? <LoadingIndicator size="sm" label="Loading due" /> : formatTaka(totalDue)} />
            <OverviewCard label="Total Remaining" icon={ShieldCheck} value={loading ? <LoadingIndicator size="sm" label="Loading remaining" /> : formatTaka(totalRemaining)} />
          </div>
        </section>

        <AssistantSummaryCard
          icon={CalendarDays}
          title="My Bill Summary"
          href={appHref(`/monthly-bill/my-details?month=${encodeURIComponent(month)}`)}
          actionLabel="Details"
        >
          Meals, deposits, expenses and utility
        </AssistantSummaryCard>

        <section className="monthly-member-overview" aria-labelledby="member-bill-overview-title">
          <div className="monthly-member-overview__header">
            <div>
              <p>MEMBER BILLS</p>
              <h2 id="member-bill-overview-title">Member overview</h2>
            </div>
            <span>{loading ? '—' : bills.length}</span>
          </div>

          {loading ? (
            <div className="monthly-member-overview__loading">
              <LoadingIndicator size="sm" label="Loading member bills" />
              <span>Loading member bills...</span>
            </div>
          ) : null}
          {!loading && bills.length ? (
            <div className="monthly-member-overview__list">
              {bills.map((bill) => (
                <MemberBillRow key={bill.id} bill={bill} member={memberByUserId.get(bill.member?.id ?? '')} messId={messId} />
              ))}
            </div>
          ) : null}
          {!loading && !bills.length ? (
            <div className="monthly-member-overview__empty">
              No generated bills for this month.
            </div>
          ) : null}

        </section>

        <div className="pb-2" />
      </div>
    </MobileShell>
  )
}
