'use client'

import Link from 'next/link'
import { useState, type ComponentType, type ReactNode } from 'react'
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
import { type PaymentMethod, type PaymentStatus } from '@/lib/form-options'
import { appHref } from '@/lib/routes'
import { MobileSelectSheet, type MobileSelectOption } from '@/components/mobile/select-sheet'
import { MonthPicker } from '@/components/mobile/date-picker'
import {
  formatDate,
  getDictionary,
  formatMoney,
  formatTime,
  paymentMethodLabel,
  paymentStatusLabel,
  depositCategoryLabel,
  useLocale,
  useLocaleFormatters,
  useTranslations,
  type Locale,
} from '@/lib/i18n'

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
  member?: { id?: string; name?: string | null; email?: string | null; avatar_url?: string | null } | null
  creator?: { id?: string; name?: string | null; email?: string | null; avatar_url?: string | null } | null
}

const avatarTones = [
  'bg-[#dff4f3] text-[#00777a]',
  'bg-[#fff1e7] text-[#ff6b00]',
  'bg-[#e7f0ff] text-[#1666d9]',
  'bg-[#fce7ef] text-[#df4d78]',
]

export function formatDepositMoney(value?: string | number | null, locale: Locale = 'en') {
  return formatMoney(value ?? 0, locale)
}

export function formatDepositDate(value?: string | null, locale: Locale = 'en') {
  if (!value) return ''
  return formatDate(value, locale, { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDepositTime(value?: string | null, locale: Locale = 'en') {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return formatTime(date, locale, { hour: 'numeric', minute: '2-digit' })
}

export function depositMemberName(item?: DepositListRecord | null, locale: Locale = 'en') {
  return item?.member?.name || item?.creator?.name || paymentFallback(locale, 'depositFallback')
}

export function depositCategory(item?: DepositListRecord | null, locale: Locale = 'en') {
  const category = item?.categories?.[0]
  return category ? depositCategoryLabel(category.replaceAll(' ', '_'), locale) : item?.note || depositCategoryLabel('MEAL_ADVANCE', locale)
}

function paymentFallback(locale: Locale, key: 'depositFallback' | 'memberFallback') {
  return getDictionary(locale).payments[key]
}

export function initials(name?: string | null) {
  const parts = String(name || 'Deposit').trim().split(/\s+/).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase()).join('') || 'D'
}

export function statusTone(status?: string | null, locale: Locale = 'en') {
  const normalized = String(status ?? 'PENDING').toUpperCase()
  if (normalized === 'APPROVED') return { label: paymentStatusLabel('APPROVED', locale), bg: '#e8f6ed', fg: '#0f8f42', icon: CheckCircle2 }
  if (normalized === 'REJECTED') return { label: paymentStatusLabel('REJECTED', locale), bg: '#fff0f0', fg: '#d92d20', icon: ShieldCheck }
  return { label: paymentStatusLabel('PENDING', locale), bg: '#fff1e7', fg: '#ff6b00', icon: Hourglass }
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
  const { locale } = useLocale()
  const tone = statusTone(status, locale)
  return (
    <span
      className="inline-flex h-8 items-center rounded-[11px] px-3 text-caption font-semibold"
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

  if (compact) {
    return (
      <section className="flex min-h-[78px] min-w-0 items-center gap-2.5 rounded-[14px] border border-[#e5ecee] bg-white px-3 py-2.5 text-left shadow-[0_6px_18px_rgba(18,55,72,0.07)]">
        {Icon ? (
          <div
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
            style={{ backgroundColor: selected.bg, color: selected.fg }}
            aria-hidden="true"
          >
            <Icon size={17} strokeWidth={2.5} />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="truncate text-caption font-semibold leading-tight text-[#789096]">{title}</div>
          <div className="mt-1 truncate text-label font-extrabold leading-none text-[#1d3a42]">{value}</div>
          {caption ? <div className="mt-1 truncate text-caption font-semibold leading-tight text-[#789096]">{caption}</div> : null}
        </div>
      </section>
    )
  }

  return (
    <section
      className="min-h-[108px] rounded-[18px] border bg-white px-2.5 py-3.5 text-center shadow-[0_10px_24px_rgba(18,55,72,0.07)]"
      style={{ borderColor: selected.border }}
    >
      {Icon ? (
        <div className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-[15px]" style={{ backgroundColor: selected.bg, color: selected.fg }}>
          <Icon size={21} strokeWidth={2.35} />
        </div>
      ) : null}
      <div className="text-caption font-semibold leading-tight" style={{ color: selected.fg }}>
        {title}
      </div>
      <div className="mt-2 truncate text-headline font-semibold leading-none text-[#1d3a42]">{value}</div>
      {caption ? <div className="mt-2 text-caption font-semibold leading-tight text-[#65838b]">{caption}</div> : null}
    </section>
  )
}

export function DepositStatPanel({ children }: { children: ReactNode }) {
  const t = useTranslations('payments')
  return (
    <section aria-label={t('depositSummary')}>
      <div className="grid grid-cols-2 gap-2.5">{children}</div>
    </section>
  )
}

export function DepositManualNotice({
  compact = false,
}: {
  compact?: boolean
}) {
  const t = useTranslations('payments')
  return (
    <section className={`relative overflow-hidden rounded-[18px] border ${compact ? 'border-[#b8d7ff] bg-[#f2f8ff]' : 'border-[#f5d7b8] bg-[#fffaf4]'} px-4 ${compact ? 'py-3' : 'py-4'}`}>
      {!compact ? <MoneyNoteArt /> : null}
      <div className="relative z-10 flex items-center gap-3">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-[#1f6feb] text-[#1f6feb]">
        <Info size={22} strokeWidth={2.4} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-body font-semibold text-[#123748]">{t('manualNotice')}</div>
        {!compact ? <div className="mt-1 text-label text-[#55727b]">{t('manualNoticeShort')}</div> : null}
      </div>
      </div>
    </section>
  )
}

export function DepositWorkCard() {
  const t = useTranslations('payments')
  const common = useTranslations('common')
  const flows = [
    {
      tone: 'teal' as const,
      steps: [
        { title: t('memberSubmits'), text: t('depositEntry'), icon: FileText },
        { title: common('managerFallback'), text: t('approves'), icon: ShieldCheck },
        { title: t('deposit'), text: t('added'), icon: WalletCards },
      ],
    },
    {
      tone: 'blue' as const,
      steps: [
        { title: t('managerAdds'), text: t('forMember'), icon: UserRound },
        { title: t('auto'), text: t('approved'), icon: CheckCircle2 },
        { title: t('deposit'), text: t('added'), icon: WalletCards },
      ],
    },
  ]

  return (
    <section className="relative overflow-hidden rounded-[20px] border border-[#cfeeed] bg-white px-3.5 py-3.5 shadow-[0_10px_24px_rgba(18,55,72,0.07)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-title-sm font-semibold text-[#00777a]">{t('howDepositsWork')}</h2>
          <p className="mt-0.5 text-caption font-semibold text-[#65838b]">{t('simpleWorkflow')}</p>
        </div>
        <div className="rounded-full border border-[#cfeeed] bg-[#f6ffff] px-2.5 py-1 text-caption font-semibold text-[#008d8c]">
          {t('twoWays')}
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
                      {index === 0 ? <span className="absolute -left-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-[#21b86f] text-caption font-semibold text-white">{flowIndex + 1}</span> : null}
                      <Icon size={17} strokeWidth={2.35} />
                    </div>
                    <div className="mt-1.5 text-caption font-semibold leading-3 text-[#123748]">{step.title}</div>
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
  const t = useTranslations('payments')
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
            <p>{t('manualNotice')}</p>
            <p><span className="mr-2 text-[#008d8c]">•</span>{t('approvalRuleMember')}</p>
            <p><span className="mr-2 text-[#008d8c]">•</span>{t('approvalRuleManager')}</p>
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
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const t = useTranslations('payments')
  return (
    <section className="deposit-aggregate-summary grid grid-cols-[1fr_1px_1fr] items-center rounded-[20px] border border-[#dce9ec] bg-white px-4 py-5 shadow-[0_10px_24px_rgba(18,55,72,0.07)]">
      <div className="flex items-center gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#edfafa] text-[#00777a]">
          <ListChecks size={24} />
        </div>
        <div>
          <div className="text-caption font-semibold text-[#65838b]">{t('totalEntries')}</div>
          <div className="mt-2 text-title font-semibold leading-none text-[#1d3a42]">{format.number(entries)}</div>
          <div className="mt-2 text-caption font-semibold text-[#65838b]">{t('thisMonth')}</div>
        </div>
      </div>
      <div className="h-16 bg-[#e0ecef]" />
      <div className="flex items-center gap-4 pl-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#edfafa] text-[#00777a]">
          <WalletCards size={24} />
        </div>
        <div>
          <div className="text-caption font-semibold text-[#65838b]">{t('totalAmount')}</div>
          <div className="mt-2 text-title font-semibold leading-none text-[#1d3a42]">{formatDepositMoney(amount, locale)}</div>
          <div className="mt-2 text-caption font-semibold text-[#65838b]">{t('thisMonth')}</div>
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
  const { locale } = useLocale()
  const name = depositMemberName(item, locale)
  const category = depositCategory(item, locale)
  const status = statusTone(item.status, locale)
  const amountTone = String(item.status ?? 'PENDING').toUpperCase() === 'PENDING' ? '#ff6b00' : '#00777a'
  const date = item.payment_date ?? item.date ?? item.created_at ?? null
  const isHorizontal = variant === 'horizontal'
  const avatarUrl = item.member?.avatar_url || item.creator?.avatar_url || null
  const className = joinClasses(
    'flex min-h-[82px] items-center gap-3',
    isHorizontal
      ? 'transaction-list-row py-3'
      : 'rounded-[18px] border border-[#dce9ec] bg-white px-3 py-3 shadow-[0_8px_20px_rgba(18,55,72,0.055)]'
  )
  const content = isHorizontal ? (
    <>
      <DepositAvatar name={name} avatarUrl={avatarUrl} toneClass={avatarTones[index % avatarTones.length]} />
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-label font-semibold leading-tight text-[#1d3a42]">{name}</strong>
        <span className="mt-1.5 flex items-center gap-1.5 text-caption font-semibold" style={{ color: status.fg }}>
          <i className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
          {status.label}
        </span>
      </span>
      <strong className="shrink-0 text-label font-extrabold tabular-nums" style={{ color: amountTone }}>
        {formatDepositMoney(item.amount, locale)}
      </strong>
    </>
  ) : (
    <>
      <DepositAvatar name={name} avatarUrl={avatarUrl} toneClass={avatarTones[index % avatarTones.length]} large />
      <div className="min-w-0 flex-1">
        <div className="truncate text-label font-semibold text-[#1d3a42]">{name}</div>
        <div className="mt-1 flex min-w-0 items-center gap-1.5 text-caption font-semibold">
          <span style={{ color: amountTone }}>{formatDepositMoney(item.amount, locale)}</span>
          <span className="text-[#789096]">.</span>
          <span className="truncate text-[#65838b]">{category}</span>
        </div>
        <div className="mt-1 text-caption font-semibold text-[#65838b]">{formatDepositDate(date, locale)} · {formatDepositTime(date, locale)}</div>
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

function DepositAvatar({
  name,
  avatarUrl,
  toneClass,
  large = false,
}: {
  name: string
  avatarUrl?: string | null
  toneClass: string
  large?: boolean
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const normalizedUrl = avatarUrl?.trim()

  return (
    <span
      className={joinClasses(
        'relative grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold ring-1 ring-black/[0.04]',
        large ? 'h-14 w-14 text-title-sm' : 'h-10 w-10 text-caption',
        toneClass
      )}
      aria-hidden="true"
    >
      {initials(name)}
      {normalizedUrl && !imageFailed ? (
        <img
          src={normalizedUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : null}
    </span>
  )
}

export function DepositMonthNavigator({
  month,
  label,
  onChange,
}: {
  month: string
  label: string
  onChange: (month: string) => void
}) {
  const t = useTranslations('payments')
  return (
    <div className="deposit-month-navigator">
      <MonthPicker
        label={t('chooseDepositMonth')}
        value={month}
        onChange={onChange}
        menuGap={6}
        menuPlacement="bottom"
        renderTrigger={({ open, selectedLabel, buttonProps }) => (
          <button {...buttonProps} className="deposit-month-trigger" aria-label={t('depositMonth')}>
            <CalendarDays size={15} strokeWidth={2.35} aria-hidden="true" />
            <span>{selectedLabel || label}</span>
            <ChevronDown size={15} strokeWidth={2.35} className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
        )}
      />
    </div>
  )
}

export function DepositOverviewCard({
  total,
  entries,
  average,
  monthLabel,
}: {
  total: number
  entries: number
  average: number
  monthLabel: string
}) {
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const t = useTranslations('payments')
  return (
    <section className="deposit-overview" aria-labelledby="deposit-overview-title">
      <div className="deposit-overview__glow" aria-hidden="true" />
      <div className="deposit-overview__heading">
        <div>
          <p>{t('collectionOverview')}</p>
          <h2 id="deposit-overview-title">{monthLabel}</h2>
        </div>
        <span className="deposit-overview__icon" aria-hidden="true">
          <WalletCards size={23} strokeWidth={2.1} />
        </span>
      </div>
      <div className="deposit-overview__total">
        <span>{t('totalCollected')}</span>
        <strong>{formatDepositMoney(total, locale)}</strong>
      </div>
      <div className="deposit-overview__metrics">
        <div>
          <span>{t('transactions')}</span>
          <strong>{format.number(entries)}</strong>
        </div>
        <i aria-hidden="true" />
        <div>
          <span>{t('averageDeposit')}</span>
          <strong>{formatDepositMoney(average, locale)}</strong>
        </div>
      </div>
    </section>
  )
}

export function DepositLedgerItem({
  item,
  href,
  index = 0,
}: {
  item: DepositListRecord
  href: string
  index?: number
}) {
  const { locale } = useLocale()
  const t = useTranslations('payments')
  const name = depositMemberName(item, locale)
  const detail = depositCategory(item, locale)
  const date = item.payment_date ?? item.date ?? item.created_at ?? null

  return (
    <Link href={appHref(href)} className="deposit-ledger-row">
      <span className={`deposit-ledger-row__avatar ${avatarTones[index % avatarTones.length]}`} aria-hidden="true">
        {initials(name)}
      </span>
      <span className="deposit-ledger-row__body">
        <strong>{name}</strong>
        <small>{detail}</small>
        <time>{formatDepositDate(date, locale)}</time>
      </span>
      <span className="deposit-ledger-row__amount">
        <strong>{formatDepositMoney(item.amount, locale)}</strong>
        <small><CheckCircle2 size={12} strokeWidth={2.5} /> {t('recorded')}</small>
      </span>
      <ChevronRight className="deposit-ledger-row__chevron" size={17} strokeWidth={2.2} aria-hidden="true" />
    </Link>
  )
}

export function DepositLedgerSkeleton() {
  const t = useTranslations('payments')
  return (
    <div className="deposit-ledger-skeleton" aria-label={t('loadingDeposits')} role="status">
      {[0, 1, 2].map((item) => (
        <div key={item}>
          <span />
          <p><i /><i /><i /></p>
          <strong />
        </div>
      ))}
    </div>
  )
}

export function DepositSearchBar({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const t = useTranslations('payments')
  return (
    <div className="deposit-search-bar grid grid-cols-[minmax(0,1fr)_52px] gap-3">
      <label className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#65838b]" size={21} />
        <input
          className="h-14 w-full rounded-[16px] border border-[#dce9ec] bg-white pl-12 pr-4 text-body font-medium text-[#123748] outline-none shadow-[0_8px_18px_rgba(18,55,72,0.04)] placeholder:text-[#7c8b98] focus:border-[#008d8c] focus:ring-4 focus:ring-[#008d8c]/10"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t('searchMemberOrNote')}
        />
      </label>
      <button type="button" className="grid h-14 place-items-center rounded-[16px] border border-[#dce9ec] bg-white text-[#00777a] shadow-[0_8px_18px_rgba(18,55,72,0.04)]" aria-label={t('filterDeposits')}>
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
  const { locale } = useLocale()
  const t = useTranslations('payments')
  const filters: Array<{ value: PaymentStatus | 'ALL'; label: string }> = [
    { value: 'ALL', label: t('allStatuses') },
    { value: 'APPROVED', label: paymentStatusLabel('APPROVED', locale) },
    { value: 'PENDING', label: paymentStatusLabel('PENDING', locale) },
  ]

  return (
    <div className="deposit-filter-tabs grid grid-cols-3 gap-2 rounded-[18px] bg-white/70 p-1.5 shadow-[0_10px_24px_rgba(18,55,72,0.05)]">
      {filters.map((filter) => {
        const active = value === filter.value
        const tone = statusTone(filter.value, locale)
        return (
          <button
            key={filter.value}
            type="button"
            onClick={() => onChange(filter.value)}
            className={`h-11 rounded-[14px] px-2 text-caption font-semibold transition active:scale-[0.98] ${active ? 'bg-[#008d8c] text-white shadow-[0_10px_20px_rgba(0,119,122,0.16)]' : 'border border-[#dce9ec] bg-white'}`}
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
  const { locale } = useLocale()
  const t = useTranslations('payments')
  const statusOptions: Array<MobileSelectOption<PaymentStatus | 'ALL'>> = [
    { value: 'ALL', label: t('allStatus') },
    { value: 'APPROVED', label: paymentStatusLabel('APPROVED', locale) },
    { value: 'PENDING', label: paymentStatusLabel('PENDING', locale) },
    { value: 'REJECTED', label: paymentStatusLabel('REJECTED', locale) },
  ]

  return (
    <div className="deposit-compact-filters grid grid-cols-2 gap-3">
      <div className="relative block">
        {showLabels ? <span className="mb-1.5 block text-caption font-semibold uppercase tracking-[0.12em] text-[#65838b]">{t('status')}</span> : null}
        <MobileSelectSheet
          label={t('status')}
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

      <div className="relative block">
        {showLabels ? <span className="mb-1.5 block text-caption font-semibold uppercase tracking-[0.12em] text-[#65838b]">{t('month')}</span> : null}
        <MonthPicker
          label={t('selectMonth')}
          value={month}
          onChange={onMonthChange}
          renderTrigger={({ open, selectedLabel, buttonProps }) => (
            <button {...buttonProps} className="flex h-12 w-full items-center gap-2 rounded-[15px] border border-[#cfeeed] bg-white px-3 text-left text-body font-semibold text-[#123748] shadow-[0_8px_18px_rgba(18,55,72,0.045)] outline-none transition focus:border-[#008d8c] focus:ring-4 focus:ring-[#008d8c]/10">
              <span className="min-w-0 flex-1 truncate">{selectedLabel}</span>
              <CalendarDays className="shrink-0 text-[#008d8c]" size={16} />
              <ChevronDown className={`shrink-0 text-[#65838b] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} size={16} />
            </button>
          )}
        />
      </div>
    </div>
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
      <div className="min-w-0 text-label font-semibold text-[#65838b]">{label}</div>
      <div className="min-w-0 text-right text-label font-semibold leading-5 text-[#1d3a42]">{value}</div>
    </div>
  )
}

export function DepositDetailsSummary({
  item,
}: {
  item: DepositListRecord | null
}) {
  const { locale } = useLocale()
  const t = useTranslations('payments')
  const status = statusTone(item?.status, locale)
  const StatusIcon = status.icon
  const MethodIcon = methodIcon(item?.method)
  const date = item?.payment_date ?? item?.date ?? item?.created_at ?? null

  return (
    <section className="deposit-details-summary py-2">
      <div className="grid grid-cols-[minmax(0,0.85fr)_1px_minmax(0,1.15fr)] gap-4">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full" style={{ backgroundColor: status.bg, color: status.fg }}>
            <StatusIcon size={30} strokeWidth={2.25} />
          </div>
          <div className="mt-3 text-display font-semibold leading-none text-[#1d3a42]">{formatDepositMoney(item?.amount, locale)}</div>
          <div className="mt-3"><DepositStatusBadge status={item?.status} /></div>
        </div>
        <div className="bg-[#e0ecef]" />
        <div className="space-y-2.5 py-1">
          <MiniFact icon={Tag} label={t('category')} value={depositCategory(item, locale)} />
          <MiniFact icon={MethodIcon} label={t('method')} value={item?.method ? paymentMethodLabel(item.method, locale) : '--'} />
          <MiniFact icon={CalendarDays} label={t('depositDate')} value={formatDepositDate(date, locale)} />
          <MiniFact icon={Clock3} label={t('time')} value={formatDepositTime(date, locale)} />
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
      <div className="text-caption font-semibold text-[#65838b]">{label}</div>
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
