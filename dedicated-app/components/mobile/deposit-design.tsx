'use client'

import Link from 'next/link'
import type { ComponentType, ReactNode } from 'react'
import {
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FileText,
  Hourglass,
  Info,
  Landmark,
  ListChecks,
  ReceiptText,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Tag,
  User,
  UserRound,
  WalletCards,
  type LucideProps,
} from 'lucide-react'
import { LABELS, PAYMENT_METHODS, type PaymentMethod, type PaymentStatus } from '@/lib/form-options'
import { appHref } from '@/lib/routes'
import { MobileSelectSheet, type MobileSelectOption } from '@/components/mobile/select-sheet'

type IconType = ComponentType<LucideProps>

function joinClasses(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export type DepositListRecord = {
  id: string
  amount: string | number
  status?: PaymentStatus | string
  method?: PaymentMethod | string | null
  payment_date?: string | null
  date?: string | null
  created_at?: string | null
  note?: string | null
  categories?: string[] | null
  member?: { id?: string; name?: string | null; email?: string | null } | null
  creator?: { id?: string; name?: string | null; email?: string | null } | null
}

const avatarTones = [
  'bg-[#dff4f3] text-[#00777a]',
  'bg-[#fff1e7] text-[#ff6b00]',
  'bg-[#e7f0ff] text-[#1666d9]',
  'bg-[#fce7ef] text-[#df4d78]',
]

export function formatDepositMoney(value?: string | number | null) {
  const amount = Number(value ?? 0)
  const symbol = String.fromCodePoint(0x09f3)
  if (!Number.isFinite(amount)) return `${symbol} 0`
  return `${symbol} ${amount.toLocaleString('en-US')}`
}

export function formatDepositDate(value?: string | null) {
  if (!value) return 'No date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDepositTime(value?: string | null) {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function depositMemberName(item?: DepositListRecord | null) {
  return item?.member?.name || item?.creator?.name || 'Deposit'
}

export function depositCategory(item?: DepositListRecord | null) {
  return item?.categories?.[0]?.replaceAll('_', ' ') || item?.note || 'Meal Advance'
}

export function initials(name?: string | null) {
  const parts = String(name || 'Deposit').trim().split(/\s+/).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase()).join('') || 'D'
}

export function statusTone(status?: string | null) {
  const normalized = String(status ?? 'PENDING').toUpperCase()
  if (normalized === 'APPROVED') return { label: 'Approved', bg: '#e8f6ed', fg: '#0f8f42', icon: CheckCircle2 }
  if (normalized === 'REJECTED') return { label: 'Rejected', bg: '#fff0f0', fg: '#d92d20', icon: ShieldCheck }
  return { label: 'Pending', bg: '#fff1e7', fg: '#ff6b00', icon: Hourglass }
}

export function methodIcon(method?: string | null): IconType {
  const key = String(method ?? '').toUpperCase()
  if (key === 'CASH') return Banknote
  if (key === 'BKASH') return Smartphone
  if (key === 'NAGAD') return Smartphone
  if (key === 'ROCKET') return Send
  if (key === 'BANK') return Landmark
  return WalletCards
}

export function DepositStatusBadge({ status }: { status?: string | null }) {
  const tone = statusTone(status)
  return (
    <span
      className="inline-flex h-8 items-center rounded-[11px] px-3 text-caption font-bold"
      style={{ backgroundColor: tone.bg, color: tone.fg }}
    >
      {tone.label}
    </span>
  )
}

export function DepositSectionTitle({
  title,
  action,
}: {
  title: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-title-sm font-semibold leading-tight text-[#1d3a42]">{title}</h2>
      {action}
    </div>
  )
}

export function DepositStatCard({
  title,
  value,
  caption,
  icon: Icon,
  tone = 'teal',
  compact = false,
}: {
  title: string
  value: ReactNode
  caption?: ReactNode
  icon?: IconType
  tone?: 'teal' | 'blue' | 'orange'
  compact?: boolean
}) {
  const tones = {
    teal: { bg: '#f2ffff', fg: '#00777a', border: '#bfe7e6' },
    blue: { bg: '#f5f8ff', fg: '#1666d9', border: '#cfe0ff' },
    orange: { bg: '#fff8f2', fg: '#ff6b00', border: '#ffd8bd' },
  }
  const selected = tones[tone]

  return (
    <section
      className={joinClasses(
        'border bg-white text-center',
        compact
          ? 'grid min-h-[68px] place-items-center rounded-[10px] px-1.5 py-2 shadow-none'
          : 'min-h-[108px] rounded-[18px] px-2.5 py-3.5 shadow-[0_10px_24px_rgba(18,55,72,0.07)]'
      )}
      style={{ borderColor: selected.border }}
    >
      {Icon ? (
        <div className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-[15px]" style={{ backgroundColor: selected.bg, color: selected.fg }}>
          <Icon size={21} strokeWidth={2.35} />
        </div>
      ) : null}
      <div className="text-caption font-bold leading-tight" style={{ color: selected.fg }}>
        {title}
      </div>
      <div className={joinClasses('truncate font-semibold leading-none text-[#1d3a42]', compact ? 'mt-1 text-body' : 'mt-2 text-headline')}>{value}</div>
      {caption ? <div className="mt-2 text-caption font-semibold leading-tight text-[#65838b]">{caption}</div> : null}
    </section>
  )
}

export function DepositStatPanel({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-[14px] border border-[#cfeeed] bg-white p-1.5 shadow-[0_6px_18px_rgba(0,119,122,0.06)]">
      <div className="grid grid-cols-3 gap-1.5">{children}</div>
    </section>
  )
}

export function DepositManualNotice({
  compact = false,
}: {
  compact?: boolean
}) {
  return (
    <section className={`relative overflow-hidden rounded-[18px] border ${compact ? 'border-[#b8d7ff] bg-[#f2f8ff]' : 'border-[#f5d7b8] bg-[#fffaf4]'} px-4 ${compact ? 'py-3' : 'py-4'}`}>
      {!compact ? <MoneyNoteArt /> : null}
      <div className="relative z-10 flex items-center gap-3">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-[#1f6feb] text-[#1f6feb]">
        <Info size={22} strokeWidth={2.4} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-body font-semibold text-[#123748]">Deposits are paid manually first, then entered here for tracking.</div>
        {!compact ? <div className="mt-1 text-label text-[#55727b]">No online payment is connected yet.</div> : null}
      </div>
      </div>
    </section>
  )
}

export function DepositWorkCard() {
  const flows = [
    {
      tone: 'teal' as const,
      steps: [
        { title: 'Member submits', text: 'deposit entry', icon: FileText },
        { title: 'Manager', text: 'approves', icon: ShieldCheck },
        { title: 'Deposit', text: 'added', icon: WalletCards },
      ],
    },
    {
      tone: 'blue' as const,
      steps: [
        { title: 'Manager adds', text: 'for a member', icon: UserRound },
        { title: 'Auto', text: 'approved', icon: CheckCircle2 },
        { title: 'Deposit', text: 'added', icon: WalletCards },
      ],
    },
  ]

  return (
    <section className="relative overflow-hidden rounded-[20px] border border-[#cfeeed] bg-white px-3.5 py-3.5 shadow-[0_10px_24px_rgba(18,55,72,0.07)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-title-sm font-bold text-[#00777a]">How Deposits Work</h2>
          <p className="mt-0.5 text-caption font-semibold text-[#65838b]">A simple workflow for everyone</p>
        </div>
        <div className="rounded-full border border-[#cfeeed] bg-[#f6ffff] px-2.5 py-1 text-caption font-bold text-[#008d8c]">
          2 ways
        </div>
      </div>
      <div className="relative z-10 mt-3 space-y-2.5">
        {flows.map((flow, flowIndex) => (
          <div key={flow.tone} className="grid grid-cols-[1fr_18px_1fr_18px_1fr] items-start rounded-[16px] border border-[#d8eeee] bg-[#fbffff] px-2.5 py-2.5">
            {flow.steps.map((step, index) => {
              const Icon = step.icon
              const color = flow.tone === 'blue' ? '#1666d9' : '#008d8c'
              const bg = flow.tone === 'blue' ? '#e7f0ff' : '#edfafa'
              return (
                <div key={step.title} className="contents">
                  <div className="text-center">
                    <div className="relative mx-auto grid h-9 w-9 place-items-center rounded-[13px] ring-1 ring-[#cfeeed]" style={{ backgroundColor: bg, color }}>
                      {index === 0 ? <span className="absolute -left-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-[#21b86f] text-caption font-bold text-white">{flowIndex + 1}</span> : null}
                      <Icon size={17} strokeWidth={2.35} />
                    </div>
                    <div className="mt-1.5 text-caption font-bold leading-3 text-[#123748]">{step.title}</div>
                    <div className="mt-0.5 text-caption font-semibold leading-3 text-[#65838b]">{step.text}</div>
                  </div>
                  {index < flow.steps.length - 1 ? <div className="mt-4 border-t-2 border-dotted" style={{ borderColor: color }} /> : null}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </section>
  )
}

export function DepositSubmitIntro() {
  return (
    <>
      <section className="rounded-[22px] border border-[#cfeeed] bg-white px-4 py-4 shadow-[0_10px_24px_rgba(18,55,72,0.07)]">
        <DepositProcessArt />
      </section>
      <section className="rounded-[20px] border border-[#bfe7e6] bg-[#f8ffff] px-4 py-4">
        <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-4">
          <div className="grid h-11 w-11 place-items-center rounded-full border-2 border-[#00777a] text-[#00777a]">
            <Info size={22} />
          </div>
          <div className="space-y-2 text-label font-semibold leading-6 text-[#123748]">
            <p>Deposits are paid manually first, then entered here.</p>
            <p><span className="mr-2 text-[#008d8c]">•</span>If a member submits a deposit entry, it needs manager approval.</p>
            <p><span className="mr-2 text-[#008d8c]">•</span>If a manager adds a deposit for a member, it is auto approved.</p>
          </div>
        </div>
      </section>
    </>
  )
}

export function DepositAggregateSummary({
  entries,
  amount,
}: {
  entries: number
  amount: number
}) {
  return (
    <section className="grid grid-cols-[1fr_1px_1fr] items-center rounded-[20px] border border-[#dce9ec] bg-white px-4 py-5 shadow-[0_10px_24px_rgba(18,55,72,0.07)]">
      <div className="flex items-center gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#edfafa] text-[#00777a]">
          <ListChecks size={24} />
        </div>
        <div>
          <div className="text-caption font-semibold text-[#65838b]">Total Entries</div>
          <div className="mt-2 text-title font-semibold leading-none text-[#1d3a42]">{entries}</div>
          <div className="mt-2 text-caption font-semibold text-[#65838b]">This month</div>
        </div>
      </div>
      <div className="h-16 bg-[#e0ecef]" />
      <div className="flex items-center gap-4 pl-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#edfafa] text-[#00777a]">
          <WalletCards size={24} />
        </div>
        <div>
          <div className="text-caption font-semibold text-[#65838b]">Total Amount</div>
          <div className="mt-2 text-title font-semibold leading-none text-[#1d3a42]">{formatDepositMoney(amount)}</div>
          <div className="mt-2 text-caption font-semibold text-[#65838b]">This month</div>
        </div>
      </div>
    </section>
  )
}

function DepositProcessArt() {
  return (
    <div className="relative mx-auto grid min-h-[86px] max-w-[330px] grid-cols-[1fr_34px_1fr_34px_1fr] items-center">
      <ArtBubble icon={WalletCards} />
      <ArrowLine />
      <ArtBubble icon={FileText} badge={<CheckCircle2 size={15} />} />
      <ArrowLine />
      <ArtBubble icon={Landmark} />
      <span className="absolute left-2 top-4 h-7 w-7 rounded-full bg-[#edfafa]" />
      <span className="absolute right-4 top-7 h-4 w-4 rounded-full bg-[#edfafa]" />
    </div>
  )
}

function ArtBubble({ icon: Icon, badge }: { icon: IconType; badge?: ReactNode }) {
  return (
    <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-[18px] border border-[#bfe7e6] bg-[#edfafa] text-[#00777a]">
      <Icon size={31} strokeWidth={2.1} />
      {badge ? <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-[#008d8c] text-white ring-2 ring-white">{badge}</span> : null}
    </div>
  )
}

function ArrowLine() {
  return <div className="h-px border-t-2 border-dashed border-[#8acdcc]" />
}

function MoneyNoteArt() {
  return (
    <div className="absolute bottom-2 right-3 hidden h-20 w-28 text-[#008d8c] opacity-80 min-[390px]:block">
      <div className="absolute right-3 top-2 h-10 w-16 rotate-[-12deg] rounded-[8px] border-2 border-[#6bcbb4] bg-[#bdebd5]" />
      <div className="absolute right-8 top-5 h-4 w-4 rounded-full border-2 border-[#199d72]" />
      <div className="absolute bottom-2 right-1 h-9 w-16 rotate-[10deg] rounded-[7px] border border-[#cfeeed] bg-white" />
      <div className="absolute bottom-5 right-8 h-1 w-7 rounded-full bg-[#ffb15a]" />
      <div className="absolute bottom-3 right-8 h-1 w-5 rounded-full bg-[#9edddc]" />
    </div>
  )
}

function BuildingWash({ className = '' }: { className?: string }) {
  return (
    <div className={`relative h-24 w-28 text-[#9edddc] ${className}`}>
      <div className="absolute bottom-0 right-2 h-14 w-16 rounded-t-[10px] bg-[#dff4f3]" />
      <div className="absolute bottom-14 right-4 h-4 w-12 bg-[#bfe7e6]" />
      <div className="absolute bottom-4 right-7 grid grid-cols-2 gap-1">
        <span className="h-3 w-3 rounded-sm bg-white/70" />
        <span className="h-3 w-3 rounded-sm bg-white/70" />
        <span className="h-3 w-3 rounded-sm bg-white/70" />
        <span className="h-3 w-3 rounded-sm bg-white/70" />
      </div>
    </div>
  )
}

export function DepositListItem({
  item,
  href,
  index = 0,
  variant = 'card',
}: {
  item: DepositListRecord
  href?: string
  index?: number
  variant?: 'card' | 'horizontal'
}) {
  const name = depositMemberName(item)
  const category = depositCategory(item)
  const status = statusTone(item.status)
  const amountTone = status.label === 'Pending' ? '#ff6b00' : '#00777a'
  const date = item.payment_date ?? item.date ?? item.created_at ?? null
  const isHorizontal = variant === 'horizontal'
  const className = joinClasses(
    'flex min-h-[82px] items-center gap-3 bg-white',
    isHorizontal
      ? 'border-y border-x-0 border-[#dce9ec] py-3 shadow-none'
      : 'rounded-[18px] border border-[#dce9ec] px-3 py-3 shadow-[0_8px_20px_rgba(18,55,72,0.055)]'
  )
  const content = (
    <>
      <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-title-sm font-bold ${avatarTones[index % avatarTones.length]}`}>
        {initials(name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-label font-semibold text-[#1d3a42]">{name}</div>
        <div className="mt-1 flex min-w-0 items-center gap-1.5 text-caption font-bold">
          <span style={{ color: amountTone }}>{formatDepositMoney(item.amount)}</span>
          <span className="text-[#789096]">.</span>
          <span className="truncate text-[#65838b]">{category}</span>
        </div>
        <div className="mt-1 text-caption font-semibold text-[#65838b]">{formatDepositDate(date)} . {formatDepositTime(date)}</div>
      </div>
      <DepositStatusBadge status={item.status} />
      <ChevronRight size={18} className="shrink-0 text-[#789096]" />
    </>
  )

  if (href) {
    return (
      <Link href={appHref(href)} className={className}>
        {content}
      </Link>
    )
  }

  return <div className={className}>{content}</div>
}

export function DepositSearchBar({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_52px] gap-3">
      <label className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#65838b]" size={21} />
        <input
          className="h-14 w-full rounded-[16px] border border-[#dce9ec] bg-white pl-12 pr-4 text-body font-medium text-[#123748] outline-none shadow-[0_8px_18px_rgba(18,55,72,0.04)] placeholder:text-[#7c8b98] focus:border-[#008d8c] focus:ring-4 focus:ring-[#008d8c]/10"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search by member or category..."
        />
      </label>
      <button type="button" className="grid h-14 place-items-center rounded-[16px] border border-[#dce9ec] bg-white text-[#00777a] shadow-[0_8px_18px_rgba(18,55,72,0.04)]" aria-label="Filter deposits">
        <SlidersHorizontal size={22} />
      </button>
    </div>
  )
}

export function DepositFilterTabs({
  value,
  onChange,
}: {
  value: PaymentStatus | 'ALL'
  onChange: (value: PaymentStatus | 'ALL') => void
}) {
  const filters: Array<{ value: PaymentStatus | 'ALL'; label: string }> = [
    { value: 'ALL', label: 'All' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'PENDING', label: 'Pending' },
  ]

  return (
    <div className="grid grid-cols-3 gap-2 rounded-[18px] bg-white/70 p-1.5 shadow-[0_10px_24px_rgba(18,55,72,0.05)]">
      {filters.map((filter) => {
        const active = value === filter.value
        const tone = statusTone(filter.value)
        return (
          <button
            key={filter.value}
            type="button"
            onClick={() => onChange(filter.value)}
            className={`h-11 rounded-[14px] px-2 text-caption font-bold transition active:scale-[0.98] ${active ? 'bg-[#008d8c] text-white shadow-[0_10px_20px_rgba(0,119,122,0.16)]' : 'border border-[#dce9ec] bg-white'}`}
            style={!active && filter.value !== 'ALL' ? { color: tone.fg, backgroundColor: tone.bg } : undefined}
          >
            {filter.label}
          </button>
        )
      })}
    </div>
  )
}

export function DepositCompactFilters({
  status,
  onStatusChange,
  month,
  onMonthChange,
  showLabels = true,
}: {
  status: PaymentStatus | 'ALL'
  onStatusChange: (value: PaymentStatus | 'ALL') => void
  month: string
  onMonthChange: (value: string) => void
  showLabels?: boolean
}) {
  const statusOptions: Array<MobileSelectOption<PaymentStatus | 'ALL'>> = [
    { value: 'ALL', label: 'All Status' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'REJECTED', label: 'Rejected' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="relative block">
        {showLabels ? <span className="mb-1.5 block text-caption font-bold uppercase tracking-[0.12em] text-[#65838b]">Status</span> : null}
        <MobileSelectSheet
          label="Status"
          value={status}
          options={statusOptions}
          onChange={onStatusChange}
          renderTrigger={({ open, selectedLabel, buttonProps }) => (
            <button
              {...buttonProps}
              className="flex h-12 w-full items-center rounded-[15px] border border-[#cfeeed] bg-white px-3 text-left text-body font-semibold text-[#123748] shadow-[0_8px_18px_rgba(18,55,72,0.045)] outline-none transition focus:border-[#008d8c] focus:ring-4 focus:ring-[#008d8c]/10"
            >
              <span className="min-w-0 flex-1 truncate">{selectedLabel}</span>
              <ChevronDown className={`shrink-0 text-[#65838b] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} size={16} />
            </button>
          )}
        />
      </div>

      <label className="relative block">
        {showLabels ? <span className="mb-1.5 block text-caption font-bold uppercase tracking-[0.12em] text-[#65838b]">Month</span> : null}
        <div className="flex h-12 items-center rounded-[15px] border border-[#cfeeed] bg-white px-3 pr-9 text-body font-semibold text-[#123748] shadow-[0_8px_18px_rgba(18,55,72,0.045)]">
          {month}
        </div>
        <input
          aria-label="Select month"
          type="month"
          value={month}
          onChange={(event) => onMonthChange(event.target.value)}
          className="absolute inset-x-0 bottom-0 h-12 cursor-pointer opacity-0"
        />
        <CalendarDays className="pointer-events-none absolute bottom-3.5 right-3 text-[#008d8c]" size={16} />
      </label>
    </div>
  )
}

export function PaymentMethodGrid({
  value,
  onChange,
}: {
  value: PaymentMethod
  onChange: (value: PaymentMethod) => void
}) {
  return (
    <section>
      <h2 className="mb-3 text-title-sm font-semibold text-[#1d3a42]">Deposit Method</h2>
      <div className="grid grid-cols-2 gap-3">
        {PAYMENT_METHODS.map((method) => {
          const active = value === method
          const Icon = methodIcon(method)
          return (
            <button
              key={method}
              type="button"
              onClick={() => onChange(method)}
              className={`grid min-h-[86px] place-items-center rounded-[17px] border px-3 py-4 text-center transition active:scale-[0.98] ${
                active
                  ? 'border-[#008d8c] bg-[#f2ffff] text-[#008d8c] shadow-[0_10px_24px_rgba(0,119,122,0.08)]'
                  : 'border-[#dce9ec] bg-white text-[#647287]'
              }`}
            >
              <Icon size={24} strokeWidth={2.25} />
              <span className="mt-2 text-label font-bold">{LABELS.PAYMENT_METHODS[method]}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function DepositInfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: IconType
  label: string
  value: ReactNode
}) {
  return (
    <div className="grid min-h-[58px] grid-cols-[40px_minmax(0,1fr)_minmax(94px,auto)] items-center gap-3 border-b border-[#e0ecef] py-3 last:border-b-0">
      <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#edfafa] text-[#00777a]">
        <Icon size={19} strokeWidth={2.3} />
      </div>
      <div className="min-w-0 text-label font-bold text-[#65838b]">{label}</div>
      <div className="min-w-0 text-right text-label font-semibold leading-5 text-[#1d3a42]">{value}</div>
    </div>
  )
}

export function DepositDetailsSummary({
  item,
}: {
  item: DepositListRecord | null
}) {
  const status = statusTone(item?.status)
  const StatusIcon = status.icon
  const MethodIcon = methodIcon(item?.method)
  const date = item?.payment_date ?? item?.date ?? item?.created_at ?? null

  return (
    <section className="rounded-[20px] border border-[#dce9ec] bg-white px-4 py-4 shadow-[0_12px_28px_rgba(18,55,72,0.08)]">
      <div className="grid grid-cols-[minmax(0,0.85fr)_1px_minmax(0,1.15fr)] gap-4">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full" style={{ backgroundColor: status.bg, color: status.fg }}>
            <StatusIcon size={30} strokeWidth={2.25} />
          </div>
          <div className="mt-3 text-display font-semibold leading-none text-[#1d3a42]">{formatDepositMoney(item?.amount)}</div>
          <div className="mt-3"><DepositStatusBadge status={item?.status} /></div>
        </div>
        <div className="bg-[#e0ecef]" />
        <div className="space-y-2.5 py-1">
          <MiniFact icon={Tag} label="Category" value={depositCategory(item)} />
          <MiniFact icon={MethodIcon} label="Method" value={item?.method ? LABELS.PAYMENT_METHODS[item.method as PaymentMethod] ?? item.method : '--'} />
          <MiniFact icon={CalendarDays} label="Deposit Date" value={formatDepositDate(date)} />
          <MiniFact icon={Clock3} label="Time" value={formatDepositTime(date)} />
        </div>
      </div>
    </section>
  )
}

function MiniFact({
  icon: Icon,
  label,
  value,
}: {
  icon: IconType
  label: string
  value: ReactNode
}) {
  return (
    <div className="grid grid-cols-[22px_minmax(0,1fr)_minmax(76px,auto)] items-center gap-2">
      <Icon size={17} className="text-[#00777a]" />
      <div className="text-caption font-bold text-[#65838b]">{label}</div>
      <div className="truncate text-right text-caption font-semibold text-[#1d3a42]">{value}</div>
    </div>
  )
}

export const depositInfoIcons = {
  method: CreditCard,
  category: Tag,
  submittedBy: User,
  depositFor: UserRound,
  approval: ShieldCheck,
  note: ReceiptText,
  entries: ListChecks,
  total: WalletCards,
  manual: Building2,
  amount: CircleDollarSign,
  date: CalendarDays,
}
