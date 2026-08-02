'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  ReceiptText,
  ShieldCheck,
  UserRound,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'
import { LoadingIndicator } from '@/components/loading-indicator'
import { CircleIcon, formatTaka } from '@/components/mobile/expense-design'
import { InlineNotice, MealMonthSelector, formatMonthLabel } from '@/components/mobile/meals-design'
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
}

type MemberRecord = {
  id: string
  user_id: string
  mess_id: string
  is_active?: boolean
  user?: {
    id?: string
    name?: string | null
    avatar_url?: string | null
  }
  mess?: { id: string }
}

function currentMonthValue() {
  return new Date().toISOString().slice(0, 7)
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
  size = 'md',
}: {
  avatarUrl?: string | null
  size?: 'sm' | 'md'
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const normalizedUrl = avatarUrl?.trim()

  if (!normalizedUrl || imageFailed) {
    return (
      <span
        className={size === 'sm'
          ? 'grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[#edfafa] text-[#00777a]'
          : 'grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-[#edfafa] text-caption font-bold text-[#00777a] ring-1 ring-[#cfeeed]'}
      >
        <UserRound size={size === 'sm' ? 20 : 22} strokeWidth={2.35} />
      </span>
    )
  }

  return (
    <span
      className={size === 'sm'
        ? 'block h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[#edfafa] ring-1 ring-[#cfeeed]'
        : 'block h-12 w-12 overflow-hidden rounded-full bg-[#edfafa] ring-1 ring-[#cfeeed]'}
    >
      <img src={normalizedUrl} alt="" className="h-full w-full object-cover" onError={() => setImageFailed(true)} />
    </span>
  )
}

function MemberAvatar({
  bill,
  member,
  messId,
}: {
  bill: BillItem
  member?: MemberRecord
  messId: string
}) {
  const name = bill.member?.name || member?.user?.name || 'Member'

  return (
    <Link
      href={appHref(`/member-details?memberId=${encodeURIComponent(bill.member?.id ?? '')}&messId=${encodeURIComponent(member?.mess_id ?? messId)}&month=${encodeURIComponent(String(bill.month).slice(0, 7))}`)}
      className="grid min-w-[62px] justify-items-center gap-1.5 text-center active:scale-[0.98]"
      aria-label={`View ${name} monthly bill details`}
    >
      <MemberPhoto avatarUrl={memberAvatarUrl(bill, member)} />
      <span className="w-[62px] truncate text-caption font-bold text-[#123748]">{name.split(' ')[0] || memberInitials(name)}</span>
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

    setLoading(true)
    setMessage('')

    Promise.all([
      api.getMyExpenseDetails(messId, `${month}-01`).catch((error) => {
        if (alive) setMessage(error instanceof Error ? error.message : 'Failed to load your bill overview.')
        return { data: null }
      }),
      api.getBillsByMess(messId, { month: `${month}-01`, limit: 500, sortBy: 'generated_at', sortOrder: 'desc' }).catch(() => ({ data: [] })),
      api.getAllMembers({ limit: 500 }).catch(() => ({ data: [] })),
    ])
      .then(([detailRes, billRes, memberRes]) => {
        if (!alive) return
        const billList = Array.isArray(billRes.data) ? (billRes.data as BillItem[]) : []
        const memberList = Array.isArray(memberRes.data) ? (memberRes.data as MemberRecord[]) : []
        setDetails((detailRes.data ?? null) as MyExpenseDetails | null)
        setBills(billList)
        setMembers(memberList.filter((member) => member.mess_id === messId || member.mess?.id === messId))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
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

        <section className="overflow-hidden rounded-[18px] border border-[#9edddc] bg-[linear-gradient(135deg,#ffffff_0%,#f4ffff_58%,#edfafa_100%)] shadow-[0_12px_28px_rgba(0,119,122,0.08)]">
          <div className="relative flex min-h-[98px] items-center gap-3 px-4 py-3.5">
            <div className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-[#008d8c]" />
            <CircleIcon icon={CalendarDays} size="lg" className="!rounded-[16px]" />
            <div className="min-w-0 flex-1">
              <div className="max-w-[160px] text-caption font-bold uppercase leading-[15px] tracking-[0.08em] text-[#00777a]">My Bill Summary</div>
              <div className="mt-1 truncate text-label font-semibold text-[#1d3a42]">
                Meals, deposits, expenses and utility
              </div>
            </div>
            <Link
              href={appHref(`/monthly-bill/my-details?month=${encodeURIComponent(month)}`)}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-[13px] border border-[#8dd8d7] bg-white px-3 text-label font-semibold text-[#1d3a42] shadow-[0_8px_18px_rgba(0,119,122,0.07)] active:scale-[0.98]"
            >
              Details <ChevronRight size={15} className="text-[#008d8c]" />
            </Link>
          </div>
        </section>

        <section className="ui-card">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-label font-bold text-[#123748]">Member Wise Summary</h2>
              <p className="mt-1 text-caption font-semibold text-[#65838b]">{bills.length} members for {formatMonthLabel(month)}</p>
            </div>
          </div>

          {loading ? <LoadingIndicator variant="card" label="Loading member bills" /> : null}
          {!loading && bills.length ? (
            <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
              {bills.map((bill) => (
                <MemberAvatar key={bill.id} bill={bill} member={memberByUserId.get(bill.member?.id ?? '')} messId={messId} />
              ))}
            </div>
          ) : null}
          {!loading && !bills.length ? (
            <div className="rounded-[16px] bg-[#edfafa] p-5 text-center text-label font-semibold text-[#65838b]">
              No generated bills for this month.
            </div>
          ) : null}

        </section>

        <div className="pb-2" />
      </div>
    </MobileShell>
  )
}
